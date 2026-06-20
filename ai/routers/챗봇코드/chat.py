from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from openai import AsyncOpenAI
from dotenv import load_dotenv
import os
import json
import httpx
import mysql.connector

load_dotenv()

router = APIRouter()
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

DB_CONFIG = {
    'host': os.getenv("DB_HOST"),
    'user': os.getenv("DB_USER"),
    'password': os.getenv("DB_PASSWORD"),
    'database': os.getenv("DB_NAME"),
    'port': int(os.getenv("DB_PORT", 3307)),
}

# Express 서버(공고/북마크/알림 등) 주소. .env에 없으면 로컬 기본값 사용.
EXPRESS_BASE_URL = os.getenv("EXPRESS_BASE_URL", "http://localhost:5000")


def get_db_connection():
    return mysql.connector.connect(**DB_CONFIG)


def _parse_json_field(val):
    if val is None:
        return []
    if isinstance(val, str):
        try:
            return json.loads(val)
        except json.JSONDecodeError:
            return []
    return val


# =====================================================
# Tool 1. 키워드 상세 조회 (FastAPI -> MySQL 직접, business_plan.py의 get_keyword_data와 동일 로직 재사용)
# =====================================================
def tool_get_keyword_detail(keyword: str) -> dict:
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT kd.keyword, kd.category, kd.reason, kd.startup_item_types,
                   kd.market_analysis, kd.government_support_links,
                   kr.ranking_score, kr.article_count, kr.search_growth_rate
            FROM keyword_details kd
            LEFT JOIN keyword_ranking kr ON kd.keyword = kr.keyword
            WHERE kd.keyword = %s
        """, (keyword,))
        row = cursor.fetchone()
        if not row:
            return {"found": False, "message": f"'{keyword}' 키워드 데이터를 찾을 수 없습니다."}
        return {
            "found": True,
            "keyword": row["keyword"],
            "category": row["category"],
            "reason": row["reason"],
            "startup_item_types": _parse_json_field(row["startup_item_types"]),
            "market_analysis": row["market_analysis"],
            "government_support_links": _parse_json_field(row["government_support_links"]),
            "ranking_score": float(row["ranking_score"]) if row["ranking_score"] is not None else None,
            "article_count": row["article_count"],
            "search_growth_rate": float(row["search_growth_rate"]) if row["search_growth_rate"] is not None else None,
        }
    finally:
        cursor.close()
        conn.close()


# =====================================================
# Tool 2. 키워드 랭킹 TOP N 조회 (FastAPI -> MySQL 직접)
# =====================================================
def tool_get_top_keywords(limit: int = 10) -> dict:
    limit = max(1, min(limit, 30))  # 과도한 조회 방지
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT keyword, ranking_score, article_count, search_growth_rate
            FROM keyword_ranking
            ORDER BY ranking_score DESC
            LIMIT %s
        """, (limit,))
        rows = cursor.fetchall()
        return {
            "found": len(rows) > 0,
            "keywords": [
                {
                    "rank": i + 1,
                    "keyword": r["keyword"],
                    "ranking_score": float(r["ranking_score"]) if r["ranking_score"] is not None else None,
                    "article_count": r["article_count"],
                    "search_growth_rate": float(r["search_growth_rate"]) if r["search_growth_rate"] is not None else None,
                }
                for i, r in enumerate(rows)
            ],
        }
    finally:
        cursor.close()
        conn.close()


# =====================================================
# Tool 3. 정부지원사업 공고 검색 (FastAPI -> Express HTTP 호출)
# Express(GET /api/announcements)는 검색 파라미터가 없어 전체를 받아온 뒤
# 여기서 제목/기관명/지원분야/지역 기준으로 필터링한다.
# user_id 기반 맞춤추천(/recommend, checkBizEnvyMatch 로직)은 Express가
# 단일 진실 공급원이므로 그쪽 엔드포인트를 그대로 호출만 한다(로직 복제 금지).
# =====================================================
async def tool_search_announcements(query: str | None = None, region: str | None = None, limit: int = 5) -> dict:
    try:
        async with httpx.AsyncClient(timeout=5.0) as http_client:
            resp = await http_client.get(f"{EXPRESS_BASE_URL}/api/announcements")
            resp.raise_for_status()
            rows = resp.json()
    except Exception as e:
        return {"found": False, "message": f"공고 서버 조회 실패: {e}"}

    if not isinstance(rows, list):
        return {"found": False, "message": "공고 데이터 형식 오류"}

    def matches(row: dict) -> bool:
        ok = True
        if query:
            haystack = f"{row.get('title', '')} {row.get('organization', '')} {row.get('support_field', '')}".lower()
            ok = ok and (query.lower() in haystack)
        if region:
            ok = ok and (row.get("region") in (region, "전국"))
        return ok

    filtered = [r for r in rows if matches(r)][: max(1, min(limit, 20))]

    return {
        "found": len(filtered) > 0,
        "count": len(filtered),
        "announcements": [
            {
                "title": r.get("title"),
                "organization": r.get("organization"),
                "support_field": r.get("support_field"),
                "region": r.get("region"),
                "target": r.get("target"),
                "end_date": r.get("end_date"),
                "detail_url": r.get("detail_url"),
            }
            for r in filtered
        ],
    }


# =====================================================
# OpenAI function calling용 tool 스펙
# =====================================================
TOOLS_SPEC = [
    {
        "type": "function",
        "function": {
            "name": "get_keyword_detail",
            "description": "TrendPilot 키워드맵 DB에서 특정 창업 트렌드 키워드의 상세 정보(트렌드 배경, 추천 창업 아이템, 시장 현황, 연관 정부지원사업, 랭킹 점수 등)를 조회한다. 사용자가 특정 키워드(예: '스마트스토어', '리필스테이션')에 대해 물어보면 사용한다.",
            "parameters": {
                "type": "object",
                "properties": {
                    "keyword": {"type": "string", "description": "조회할 키워드. 예: '스마트스토어'"},
                },
                "required": ["keyword"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_top_keywords",
            "description": "현재 랭킹 점수가 가장 높은 인기 창업 트렌드 키워드 목록을 조회한다. 사용자가 '요즘 뜨는 트렌드', 'TOP 키워드', '인기 창업 아이템' 등을 물어보면 사용한다.",
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {"type": "integer", "description": "조회할 키워드 개수 (기본 10, 최대 30)"},
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_announcements",
            "description": "정부 창업지원사업 공고를 검색한다. 사용자가 특정 분야/지역/기관의 지원사업 공고를 찾아달라고 하면 사용한다. 사용자 개인 맞춤 추천(로그인 기반)은 이 도구로 처리하지 않고, '마이페이지에서 맞춤 공고 보기 기능을 이용해보세요'라고 안내한다.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "검색어 (공고 제목, 주관기관명, 지원분야 등에 포함된 단어)"},
                    "region": {"type": "string", "description": "지역명 (예: '서울', '부산'). 생략 가능."},
                    "limit": {"type": "integer", "description": "최대 결과 개수 (기본 5, 최대 20)"},
                },
                "required": [],
            },
        },
    },
]

TOOL_DISPATCH = {
    "get_keyword_detail": lambda args: tool_get_keyword_detail(args.get("keyword", "")),
    "get_top_keywords": lambda args: tool_get_top_keywords(args.get("limit", 10)),
}
# search_announcements는 async라 별도 분기 처리한다.


SYSTEM_PROMPT = """
너는 THELEADERS(TrendPilot) 서비스의 창업 전문 AI 어시스턴트야.
예비창업자들이 정부 지원사업 공고를 이해하고, 트렌드를 파악하고,
사업계획서를 준비하는 데 도움을 줘.

# 핵심 원칙
- 키워드 트렌드, 인기 키워드 순위, 정부지원사업 공고에 대한 구체적 사실/수치를 답할 때는
  반드시 제공된 도구(tool)를 호출해서 실제 데이터로 답한다. 학습된 지식만으로 짐작해서
  답하지 않는다 (예: 실제 존재 여부가 불확실한 키워드나 공고를 지어내지 않는다).
- 도구 호출 결과에 found:false 또는 빈 목록이 오면, 데이터가 없다는 사실을 사용자에게
  솔직히 알리고 대안(다른 키워드 시도, 직접 공고 페이지 확인 등)을 제안한다.
- 도구로 조회할 필요가 없는 일반 질문(서비스 사용법, 인사, 일반 창업 상식 등)은
  도구 없이 바로 자연스럽게 답한다.
- 항상 친절하고 실용적인 답변을 한국어로, 너무 길지 않게 제공한다.
"""


class ChatRequest(BaseModel):
    message: str
    history: list = []  # 이전 대화 내역


async def _run_tool_calls(tool_calls) -> list[dict]:
    """GPT가 요청한 tool_calls를 실제로 실행하고, 메시지 히스토리에 추가할 결과 리스트를 반환한다."""
    results = []
    for tc in tool_calls:
        name = tc.function.name
        try:
            args = json.loads(tc.function.arguments or "{}")
        except json.JSONDecodeError:
            args = {}

        if name == "search_announcements":
            output = await tool_search_announcements(
                query=args.get("query"),
                region=args.get("region"),
                limit=args.get("limit", 5),
            )
        elif name in TOOL_DISPATCH:
            output = TOOL_DISPATCH[name](args)
        else:
            output = {"error": f"unknown tool: {name}"}

        results.append({
            "tool_call_id": tc.id,
            "role": "tool",
            "name": name,
            "content": json.dumps(output, ensure_ascii=False),
        })
    return results


async def stream_generator(message: str, history: list):
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for h in history:
        messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": message})

    # 1차 호출: GPT가 tool 호출이 필요한지 판단 (스트리밍 안 함 — tool_calls는
    # 스트림 도중 끊겼다 이어붙이기가 번거롭고, 어차피 1차 응답 자체를 보여줄 일은 없다)
    first = await client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        tools=TOOLS_SPEC,
        tool_choice="auto",
        temperature=0.3,
    )
    choice = first.choices[0]

    if choice.message.tool_calls:
        # tool 호출 메시지를 히스토리에 추가
        messages.append({
            "role": "assistant",
            "content": choice.message.content,
            "tool_calls": [
                {
                    "id": tc.id,
                    "type": "function",
                    "function": {"name": tc.function.name, "arguments": tc.function.arguments},
                }
                for tc in choice.message.tool_calls
            ],
        })
        # 실제 도구 실행 결과를 히스토리에 추가
        tool_results = await _run_tool_calls(choice.message.tool_calls)
        messages.extend(tool_results)

        # 2차 호출: 도구 결과를 반영한 최종 답변을 스트리밍
        stream = await client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            stream=True,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta
    else:
        # tool 호출이 필요 없었던 경우: 1차 응답 내용을 그대로 흘려보낸다.
        # (이미 완성된 텍스트라 진짜 스트리밍은 아니지만, 응답 형식을 통일해
        # 프론트가 분기 처리를 할 필요가 없게 한다)
        content = choice.message.content or ""
        yield content


@router.post("/chat")
async def chat(req: ChatRequest):
    return StreamingResponse(
        stream_generator(req.message, req.history),
        media_type="text/plain"
    )