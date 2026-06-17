"""
market_service.py
시장현황 — JSON 파일에서 읽기
DB 전환 시: load_market_data() 내부만 DB 쿼리로 교체
"""

from openai import AsyncOpenAI
from dotenv import load_dotenv
import json
import os

load_dotenv()
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

_MARKET_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "market_analysis_all.json")

SYSTEM_PROMPT = """
당신은 정부지원사업 심사위원 출신의 시장분석 컨설턴트입니다.
주어진 창업 키워드와 뉴스 데이터를 기반으로 예비 창업자가 시장성을 판단할 수 있도록 시장 현황을 분석해주세요.
단순 뉴스 요약이 아니라 시장 규모, 성장성, 소비자 수요, 경쟁 환경, 창업 기회를 중심으로 종합 분석해야 합니다.

# 제약조건
- 뉴스 내용만 그대로 나열하지 않는다.
- 여러 뉴스의 공통 흐름을 종합하여 분석한다.
- 시장 성장 가능성과 창업 관점을 반드시 포함한다.
- 객관적인 표현을 사용한다.
- 250자~400자 내외로 작성한다.
- 제목, JSON, 설명 없이 본문 텍스트만 출력한다.
- 한 문단으로 자연스럽게 작성한다.
- 투자 권유 문구는 사용하지 않는다.
- 불확실한 내용은 추정하지 않는다.

# 필수 포함 요소 (자연스럽게 연결)
1. 현재 시장 분위기
2. 소비자 수요 변화
3. 경쟁 강도
4. 창업 기회
"""


def load_market_data() -> dict[str, str]:
    """JSON에서 로드 — DB 전환 시 이 함수만 교체"""
    with open(_MARKET_PATH, encoding="utf-8") as f:
        data = json.load(f)
    return {kw: v["market_analysis"] for kw, v in data.items()}
    # TODO: DB 전환 시
    # rows = await db.query("SELECT keyword, market_analysis FROM keywords")
    # return {row["keyword"]: row["market_analysis"] for row in rows}


async def generate_market_analysis(keyword: str, reason: str) -> str:
    """JSON에서 먼저 찾고 없으면 LLM 호출 (fallback)"""

    # 1. JSON에서 조회
    market_data = load_market_data()
    if keyword in market_data:
        return market_data[keyword]

    # 2. 없으면 LLM 호출
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": f"창업 키워드: {keyword}\n트렌드 배경: {reason}"}
        ],
        temperature=0.3,
        max_tokens=400,
    )
    return response.choices[0].message.content or ""