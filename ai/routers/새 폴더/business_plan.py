from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from openai import AsyncOpenAI
from dotenv import load_dotenv
import olefile
import os
import json
import subprocess
import mysql.connector

from .section_guides import get_guide_for_section

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

def get_db_connection():
    return mysql.connector.connect(**DB_CONFIG)


# =====================================================
# 1. 키워드 트렌드 데이터 조회
# =====================================================
@router.get("/keyword-data/{keyword}")
def get_keyword_data(keyword: str):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT kd.keyword, kd.category, kd.reason, kd.startup_item_types,
                   kd.market_analysis, kd.government_support_links,
                   kd.compact_evidence_articles,
                   kr.ranking_score, kr.article_count, kr.search_growth_rate
            FROM keyword_details kd
            LEFT JOIN keyword_ranking kr ON kd.keyword = kr.keyword
            WHERE kd.keyword = %s
        """, (keyword,))
        row = cursor.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="키워드 데이터를 찾을 수 없습니다.")

        def parse_json_field(val):
            if val is None:
                return None
            if isinstance(val, str):
                try:
                    return json.loads(val)
                except json.JSONDecodeError:
                    return None
            return val

        return {
            "keyword": row["keyword"],
            "category": row["category"],
            "reason": row["reason"],
            "startup_item_types": parse_json_field(row["startup_item_types"]) or [],
            "market_analysis": row["market_analysis"],
            "government_support_links": parse_json_field(row["government_support_links"]) or [],
            "news_articles": parse_json_field(row["compact_evidence_articles"]) or [],
            "ranking_score": float(row["ranking_score"]) if row["ranking_score"] is not None else None,
            "article_count": row["article_count"],
            "search_growth_rate": float(row["search_growth_rate"]) if row["search_growth_rate"] is not None else None,
        }
    finally:
        cursor.close()
        conn.close()


# =====================================================
# 2. 양식 파일(PDF/HWP) 업로드 → 텍스트 추출 → 섹션 구조 파악
# =====================================================
def extract_pdf_text(pdf_path: str) -> str:
    result = subprocess.run(
        ["pdftotext", "-layout", pdf_path, "-"],
        capture_output=True, text=True, check=True
    )
    return result.stdout

def extract_hwp_text(hwp_path: str) -> str:
    try:
        f = olefile.OleFileIO(hwp_path)
        data = f.openstream('PrvText').read()
        return data.decode('utf-16-le', errors='ignore')
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"HWP 파싱 실패: {str(e)}")

TEMP_UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "../temp_uploads")
os.makedirs(TEMP_UPLOAD_DIR, exist_ok=True)

@router.post("/parse-template")
async def parse_template(template: UploadFile = File(...)):
    ext = os.path.splitext(template.filename)[1].lower()
    if ext not in (".pdf", ".hwp"):
        raise HTTPException(status_code=415, detail="PDF 또는 HWP 파일만 업로드 가능합니다.")

    temp_path = os.path.join(TEMP_UPLOAD_DIR, template.filename)
    try:
        with open(temp_path, "wb") as f:
            f.write(await template.read())

        if ext == ".pdf":
            raw_text = extract_pdf_text(temp_path)
        else:
            raw_text = extract_hwp_text(temp_path)

        if not raw_text.strip():
            raise HTTPException(status_code=422, detail="파일에서 텍스트를 추출하지 못했습니다.")

        structure_prompt = f"""
다음은 정부지원사업 사업계획서 양식의 원문 텍스트다.
이 양식에서 사용자가 작성해야 하는 "항목(섹션)" 목록을 순서대로 추출하라.

[원문]
{raw_text[:6000]}

[출력 형식]
아래 JSON 형식의 객체만 출력하라. 다른 설명은 금지한다.
{{
  "sections": [
    {{"key": "영문key_camelCase", "label": "항목명(한글)", "sub": "부제목 또는 빈 문자열", "number": "번호(예: 1, 1-1) 또는 빈 문자열", "placeholder": "이 항목에 어떤 내용을 써야 하는지 1문장 안내"}}
  ]
}}
"""
        completion = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": structure_prompt}],
            temperature=0.2,
            response_format={"type": "json_object"},
        )

        parsed = json.loads(completion.choices[0].message.content)
        sections = parsed.get("sections", [])

        return {
            "templateName": os.path.splitext(template.filename)[0],
            "sections": [{"key": "cover", "label": "표지", "placeholder": ""}] + sections,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"양식 분석 중 오류: {str(e)}")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


# =====================================================
# 3. 사업계획서 본문 생성 (섹션별 JSON)
# =====================================================
class SectionInfo(BaseModel):
    key: str
    label: str
    sub: str | None = ""
    placeholder: str | None = ""

class UserDataInfo(BaseModel):
    적용분야: list[str] = []
    보유기술: str = ""
    창업동기: str = ""
    마케팅전략: str = ""
    추진계획: str = ""
    팀구성: str = ""

class PlanInfo(BaseModel):
    title: str = ""
    summary: str = ""

class BusinessPlanGenerateRequest(BaseModel):
    sections: list[SectionInfo]
    keyword: str | None = None
    userData: UserDataInfo
    plan: PlanInfo
    # KeywordMap.tsx에서 버블 클릭 시 /api/keyword-map/market-analysis/{keyword} 로
    # 새로 생성되어 marketCache에만 보관되는 값. keyword_details.market_analysis 컬럼보다
    # 최신일 수 있으므로, 값이 오면 DB 조회값보다 우선 사용한다.
    marketAnalysisOverride: str | None = None

def _label_of(item) -> str:
    """government_support_links 항목 하나를 사람이 읽을 라벨 문자열로 변환.
    KeywordMap.tsx의 govSupports: string[] 타입 정의로 스키마가 확정됨 — 단순 문자열 배열.
    혹시 과거 데이터에 객체가 섞여 있을 경우를 대비해 방어 처리만 남겨둔다."""
    if isinstance(item, str):
        return item
    if isinstance(item, dict):
        return item.get("name") or item.get("title") or item.get("label") or str(item)
    return str(item)


def _article_line(a: dict) -> str:
    """뉴스 기사 1건을 "제목 (출처 · 날짜)" 형태로 변환.
    KeywordMap.tsx의 NewsArticle 인터페이스로 필드명이 확정됨:
    { title, url, source, published_at }"""
    title = a.get("title", "")
    source = a.get("source", "")
    published_at = a.get("published_at", "")
    meta = " · ".join(filter(None, [source, published_at]))
    return f"{title} ({meta})" if meta else title


def fetch_keyword_context(keyword: str, market_analysis_override: str | None = None) -> str:
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT category, reason, startup_item_types, market_analysis,
                   government_support_links, compact_evidence_articles
            FROM keyword_details WHERE keyword = %s
        """, (keyword,))
        row = cursor.fetchone()
        if not row:
            return ""

        def parse_json_field(val):
            if val is None:
                return []
            if isinstance(val, str):
                try:
                    return json.loads(val)
                except json.JSONDecodeError:
                    return []
            return val

        startup_items = parse_json_field(row["startup_item_types"])
        gov_links = parse_json_field(row["government_support_links"])
        articles = parse_json_field(row["compact_evidence_articles"])

        gov_links_text = ", ".join(_label_of(g) for g in gov_links) if gov_links else "(연계 정책 정보 없음)"
        articles_text = "\n  ".join(f"· {_article_line(a)}" for a in articles) if articles else "(관련 기사 없음)"

        # KeywordMap.tsx에서 버블 클릭 시 별도 API(/api/keyword-map/market-analysis/{keyword})로
        # 갱신되는 marketCache 값이 있으면 그것을 우선 사용한다. 그 캐시는 DB의
        # keyword_details.market_analysis 컬럼에는 반영되지 않을 수 있어 더 최신일 가능성이 높다.
        market_analysis_text = (market_analysis_override or row["market_analysis"] or "(데이터 없음)")

        # 키워드맵 패널(트렌드인 이유 / 추천 창업 아이템 / 시장 현황 / 관련 정책 / 관련 뉴스)과
        # 1:1로 대응되도록 구조화. 각 항목을 "어느 섹션에 우선 활용할지"까지 명시해
        # GPT가 단순 나열이 아니라 의도적으로 배치하도록 유도한다.
        return f"""
[키워드맵 트렌드 데이터: {keyword}]{f" (분류: {row['category']})" if row.get("category") else ""}

1) 트렌드인 이유 (→ 문제인식/배경 및 필요성 섹션의 외적 동기 근거로 활용)
{row["reason"] or "(데이터 없음)"}

2) 추천 창업 아이템 (→ 아이템 개요, 차별성 섹션에서 본 아이템 포지셔닝 근거로 활용)
{", ".join(startup_items) if startup_items else "(데이터 없음)"}

3) 시장 현황 (→ 목표시장/시장분석 섹션의 핵심 근거로 활용)
{market_analysis_text}

4) 관련 정책 (→ 성장전략/사업화 섹션의 자금조달·정부지원 연계 근거로 활용)
{gov_links_text}

5) 관련 뉴스 (→ 문제인식·시장분석 섹션에서 최신 시그널 근거로 인용. 기사 제목/출처를 그대로 베끼지 말고 사실관계만 활용)
  {articles_text}
""".strip()
    finally:
        cursor.close()
        conn.close()

SYSTEM_PROMPT = """
당신은 창업진흥원/중소벤처기업부 사업계획서 평가위원이다.
아래 항목별로 실제 정부지원사업 제출 수준의 사업계획서 본문을 작성한다.

# 작성 원칙
- 추상적 표현 금지, 구체적 수치/방안 제시
- 각 항목은 250~500자 분량
- [키워드맵 트렌드 데이터]의 5개 항목(트렌드인 이유/추천 창업 아이템/시장 현황/관련 정책/관련 뉴스)을 가능한 한 빠짐없이 활용하되, 각 항목 옆에 표시된 "(→ ... 섹션에 활용)" 안내에 따라 적절한 섹션에 배치한다. 모든 섹션에 모든 데이터를 욱여넣지 않는다.
- 양식의 항목 제목과 순서를 임의로 바꾸지 않는다
- 수치를 제시할 때는 가능한 한 근거(기관명/연도 등)를 함께 적고, 근거가 없는 수치는 지어내지 않는다
- 각 항목 아래에 "[작성 구조 - ...]"로 제공되는 가이드를 그 항목에 한해 참고하여, 같은 흐름(주장→근거→연결)으로 작성한다.
  단, 가이드의 예시 문구나 다른 사업 아이템(예시 속 제품명)을 그대로 베끼지 말고 본 아이템 내용으로 새로 작성한다.
- 중요: [사용자 입력 정보]의 "아이템명"/"한줄 요약"은 어디까지나 사용자가 작성 중인 문서 제목란에 적힌 값일 뿐이다.
  사용자가 비워뒀거나 "TrendPilot", "창업 지원 플랫폼" 등 이 서비스 자체를 설명하는 문구가 들어있다면
  절대 사업 아이템의 실제 내용으로 취급하지 말고 무시한다. 사업 아이템의 실제 정체성은 [키워드맵 트렌드 데이터]의
  키워드와 트렌드인 이유를 기준으로 판단한다. 즉 작성 대상은 항상 "키워드맵 트렌드 데이터의 키워드를 활용한 창업
  아이템"이며, 사업계획서를 자동 생성해주는 TrendPilot/AI 서비스 자체에 대한 설명을 본문에 절대 쓰지 않는다.
- [사용자 입력 정보]의 보유기술/창업동기/마케팅전략/추진계획/팀구성 항목이 비어 있으면, 없는 사실을 지어내지 말고
  [키워드맵 트렌드 데이터]의 추천 창업 아이템·시장 현황을 근거로 그 업종에서 통상적으로 필요한 역량·전략을
  현실적인 수준으로 제시한다 (예: 화려한 미보유 기술을 사실처럼 단정하지 않는다).
- 특히 다음 항목은 사실관계 검증이 쉬워 허위 기재 시 평가에서 치명적이므로, [사용자 입력 정보]나
  [키워드맵 트렌드 데이터]에 실제 근거가 없으면 절대 단정적으로 적지 않는다: 특허/지식재산권 출원·등록 여부,
  구체적 외부 협력기관명, 구체적 기술 스택/알고리즘명, 구체적 학력·경력 연차. 가이드에 "있다면 명시"라고
  적혀 있어도 데이터가 없으면 해당 문장을 통째로 생략하거나 "추후 확보 예정" 같은 계획형 표현으로 대체하고,
  마치 이미 보유한 것처럼 서술하지 않는다.

# 출력형식
반드시 아래 JSON 객체만 출력한다. 키는 주어진 section key 그대로 사용한다.
{ "key1": "내용", "key2": "내용", ... }
"""

def build_section_block(s: SectionInfo) -> str:
    """섹션 1개에 대해 (기본 정보 + 유형별 작성 가이드)를 합쳐 user_prompt용 블록 문자열을 만든다."""
    guide = get_guide_for_section(s.label, s.sub, s.placeholder)
    header = f'- key: "{s.key}", 항목명: "{s.label}"{f" ({s.sub})" if s.sub else ""}, 안내: {s.placeholder}'
    return f"{header}\n  {guide.guide}"

# plan.title/summary에 TrendPilot 자기소개가 섞여 들어왔을 때 GPT가 그걸 사업 아이템
# 내용으로 오인하는 사고가 실제로 있었다(예: "리필스테이션" 키워드인데 본문에
# "뉴스 데이터 분석 알고리즘", "Python과 R" 같은 TrendPilot 자체 기술이 섞여 나옴).
# 프론트에서 키워드 진입 시 summary를 비우도록 고쳤지만, 과거 저장된 plan이나
# 다른 경로로 값이 새어 들어올 수 있으므로 백엔드에서도 한 번 더 걸러낸다.
_SELF_REFERENCE_MARKERS = ["trendpilot", "창업 지원 통합 플랫폼", "창업지원공고데이터 기반"]

def _sanitize_plan_field(value: str) -> str:
    if not value:
        return "(미입력)"
    if any(marker.lower() in value.lower() for marker in _SELF_REFERENCE_MARKERS):
        return "(미입력 - TrendPilot 서비스 자체에 대한 설명이 감지되어 무시함)"
    return value

@router.post("/generate")
async def generate_business_plan(req: BusinessPlanGenerateRequest):
    keyword_context = (
        fetch_keyword_context(req.keyword, req.marketAnalysisOverride)
        if req.keyword else ""
    )

    # 디버그용: GPT에 실제로 전달되는 키워드맵 트렌드 데이터를 콘솔에 출력.
    # 생성된 사업계획서의 수치(예: 시장규모 "1조원")가 DB 원문에서 온 것인지
    # GPT가 새로 만든 것인지 의심될 때, 이 로그의 "3) 시장 현황" 항목과
    # 실제 생성 결과를 직접 대조해서 확인할 수 있다.
    print("=" * 60)
    print(f"[business-plan/generate] keyword={req.keyword!r}")
    print(keyword_context or "(키워드 없음 또는 DB에 데이터 없음)")
    print("=" * 60)

    section_blocks = [
        build_section_block(s) for s in req.sections if s.key != "cover"
    ]
    section_list = "\n\n".join(section_blocks)

    safe_title = _sanitize_plan_field(req.plan.title)
    safe_summary = _sanitize_plan_field(req.plan.summary)

    user_prompt = f"""
{keyword_context}

[사용자 입력 정보]
(아래 값이 "(미입력)"이면 키워드맵 트렌드 데이터만 근거로 작성할 것)
- 아이템명: {safe_title}
- 한줄 요약: {safe_summary}
- 적용분야: {", ".join(req.userData.적용분야) or "(미입력)"}
- 보유기술: {req.userData.보유기술 or "(미입력)"}
- 창업동기: {req.userData.창업동기 or "(미입력)"}
- 마케팅전략: {req.userData.마케팅전략 or "(미입력)"}
- 추진계획: {req.userData.추진계획 or "(미입력)"}
- 팀구성: {req.userData.팀구성 or "(미입력)"}

[작성해야 할 항목 목록]
{section_list}
"""

    try:
        completion = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.6,
            response_format={"type": "json_object"},
        )
        content = json.loads(completion.choices[0].message.content)
        return {"content": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI 생성 중 오류: {str(e)}")