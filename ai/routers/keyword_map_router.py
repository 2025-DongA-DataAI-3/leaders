"""
keyword_map_router.py
FastAPI 라우터 — 키워드맵 화면용 노드/링크 데이터 제공
엔드포인트: GET /api/keyword-map
"""

from fastapi import APIRouter
import json
import os

router = APIRouter()

SEED_KEYWORDS = [
    "스마트스토어", "비건", "디지털노마드", "제로웨이스트", "업사이클링",
    "전자책", "무인카페", "홈케어", "플리마켓", "아이돌봄",
    "출장세차", "AI교육", "팝업스토어", "펫케어",
]

LLM_RESULT_PATH = os.path.join(
    os.path.dirname(__file__),
    "..",
    "data",
    "llm_result_final_v11.json"
)


def load_llm_result() -> list[dict]:
    with open(LLM_RESULT_PATH, encoding="utf-8") as f:
        data = json.load(f)
    return [d for d in data if d.get("final_decision") == "KEEP"]


def build_keyword_map_data(llm_data: list[dict]) -> dict:

    # 1. 씨드 노드
    seed_nodes = [
        {"id": kw, "keyword": kw, "type": "seed"}
        for kw in SEED_KEYWORDS
    ]

    # 2. 추출 키워드 노드 — 분석 패널에 필요한 필드 전부 포함
    extracted_nodes = []
    for item in llm_data:
        articles = item.get("compact_evidence_articles", [])
        extracted_nodes.append({
            "id":               item["keyword"],
            "keyword":          item["keyword"],
            "type":             "extracted",
            "linked_seeds":     [
                s for s in item.get("linked_seed_categories", [])
                if s in SEED_KEYWORDS
            ],
            "linked_seed_count": len([
                s for s in item.get("linked_seed_categories", [])
                if s in SEED_KEYWORDS
            ]),
            "article_count":    item.get("article_count", 0),
            "max_keybert_score": item.get("max_keybert_score", 0),
            # 분석 패널용
            "reason":           item.get("reason", ""),
            "startup_item_types": item.get("startup_item_types", []),
            "government_support_links": item.get("government_support_links", []),
            "news_articles": [
                {
                    "title":        a.get("title", ""),
                    "url":          a.get("url", ""),
                    "source":       a.get("source", ""),
                    "published_at": a.get("published_at", ""),
                }
                for a in articles[:3]  # 최대 3개
            ],
        })

    # 3. 링크: 추출 키워드 ↔ 씨드
    links = []
    for item in llm_data:
        kw = item["keyword"]
        linked = [s for s in item.get("linked_seed_categories", []) if s in SEED_KEYWORDS]

        # compact_evidence_articles에서 씨드별 최고 keybert_score 추출
        seed_scores: dict[str, float] = {}
        for art in item.get("compact_evidence_articles", []):
            seed = art.get("category", "")
            score = art.get("keybert_score", 0)
            if seed in SEED_KEYWORDS:
                if seed not in seed_scores or score > seed_scores[seed]:
                    seed_scores[seed] = score

        # linked_seeds 중 score 기준 상위 2개만 연결
        scored = [(s, seed_scores.get(s, 0)) for s in linked if s in SEED_KEYWORDS]
        top2 = sorted(scored, key=lambda x: -x[1])[:2]

        for seed, _ in top2:
            links.append({
                "source":            kw,
                "target":            seed,
                "linked_seed_count": len(linked),
            })


    return {                         
        "seed_nodes":      seed_nodes,
        "extracted_nodes": extracted_nodes,
        "links":           links,
    }

@router.get("/api/keyword-map")
def get_keyword_map():
    llm_data = load_llm_result()
    return build_keyword_map_data(llm_data)
