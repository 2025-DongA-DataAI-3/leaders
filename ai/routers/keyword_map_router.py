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

SEED_CATEGORY: dict[str, str] = {
    "스마트스토어": "AI/기술창업",
    "전자책":       "콘텐츠",
    "무인카페":     "푸드/외식",
    "플리마켓":     "공간/오프라인",
    "AI교육":       "교육",
    "디지털노마드": "디지털서비스",
    "제로웨이스트": "친환경",
    "아이돌봄":     "시니어/돌봄",
    "팝업스토어":   "공간/오프라인",
    "출장세차":     "시니어/돌봄",
    "비건":         "친환경",
    "업사이클링":   "친환경",
    "홈케어":       "시니어/돌봄",
    "펫케어":       "시니어/돌봄",
}

LLM_RESULT_PATH = os.path.join(
    os.path.dirname(__file__), "..", "data", "llm_result_final_v11.json"
)

SEED_RESULT_PATH = os.path.join(
    os.path.dirname(__file__), "..", "data", "seed_keyword_result_v1.json"
)


def load_llm_result() -> list[dict]:
    with open(LLM_RESULT_PATH, encoding="utf-8") as f:
        data = json.load(f)
    return [d for d in data if d.get("final_decision") == "KEEP"]


def load_seed_result() -> dict[str, dict]:
    with open(SEED_RESULT_PATH, encoding="utf-8") as f:
        data = json.load(f)
    return {item["keyword"]: item for item in data}


def build_keyword_map_data(llm_data: list[dict], seed_data: dict[str, dict]) -> dict:

    # 1. 씨드 노드
    seed_nodes = []
    for kw in SEED_KEYWORDS:
        sd = seed_data.get(kw, {})
        seed_nodes.append({
            "id":       kw,
            "keyword":  kw,
            "type":     "seed",
            "category": SEED_CATEGORY.get(kw, "기타"),
            "reason":                   sd.get("reason", ""),
            "startup_item_types":       sd.get("startup_item_types", []),
            "government_support_links": sd.get("government_support_links", []),
            "news_articles": [
                {"title": a.get("title", ""), "url": a.get("url", "")}
                for a in sd.get("compact_evidence_articles", [])[:3]
            ],
        })

    # 2. 추출 키워드 노드
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
            "article_count":     item.get("article_count", 0),
            "max_keybert_score": item.get("max_keybert_score", 0),
            "reason":            item.get("reason", ""),
            "startup_item_types":       item.get("startup_item_types", []),
            "government_support_links": item.get("government_support_links", []),
            "news_articles": [
                {
                    "title":        a.get("title", ""),
                    "url":          a.get("url", ""),
                    "source":       a.get("source", ""),
                    "published_at": a.get("published_at", ""),
                }
                for a in articles[:3]
            ],
        })

    # 3. 링크
    links = []
    for item in llm_data:
        kw = item["keyword"]
        linked = [s for s in item.get("linked_seed_categories", []) if s in SEED_KEYWORDS]

        seed_scores: dict[str, float] = {}
        for art in item.get("compact_evidence_articles", []):
            seed = art.get("category", "")
            score = art.get("keybert_score", 0)
            if seed in SEED_KEYWORDS:
                if seed not in seed_scores or score > seed_scores[seed]:
                    seed_scores[seed] = score

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
    llm_data  = load_llm_result()
    seed_data = load_seed_result()
    return build_keyword_map_data(llm_data, seed_data)