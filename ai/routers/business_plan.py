from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from openai import AsyncOpenAI
from dotenv import load_dotenv
import olefile
import os
import json
import subprocess
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

def fetch_keyword_context(keyword: str) -> str:
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT reason, startup_item_types, market_analysis,
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

        return f"""
[트렌드 키워드: {keyword}]
- 트렌드 배경: {row["reason"] or ""}
- 추천 창업 아이템: {", ".join(startup_items)}
- 시장 현황: {row["market_analysis"] or ""}
- 연관 정부지원사업: {", ".join(gov_links)}
- 관련 기사: {" / ".join(a.get("title", "") for a in articles)}
"""
    finally:
        cursor.close()
        conn.close()

SYSTEM_PROMPT = """
당신은 창업진흥원/중소벤처기업부 사업계획서 평가위원이다.
아래 항목별로 실제 정부지원사업 제출 수준의 사업계획서 본문을 작성한다.

# 작성 원칙
- 추상적 표현 금지, 구체적 수치/방안 제시
- 각 항목은 250~500자 분량
- 트렌드 데이터와 사용자 입력 데이터를 근거로 활용
- 양식의 항목 제목과 순서를 임의로 바꾸지 않는다

# 출력형식
반드시 아래 JSON 객체만 출력한다. 키는 주어진 section key 그대로 사용한다.
{ "key1": "내용", "key2": "내용", ... }
"""

@router.post("/generate")
async def generate_business_plan(req: BusinessPlanGenerateRequest):
    keyword_context = fetch_keyword_context(req.keyword) if req.keyword else ""

    section_list = "\n".join(
        f'- key: "{s.key}", 항목명: "{s.label}"{f" ({s.sub})" if s.sub else ""}, 안내: {s.placeholder}'
        for s in req.sections if s.key != "cover"
    )

    user_prompt = f"""
{keyword_context}

[사용자 입력 정보]
- 아이템명: {req.plan.title}
- 한줄 요약: {req.plan.summary}
- 적용분야: {", ".join(req.userData.적용분야)}
- 보유기술: {req.userData.보유기술}
- 창업동기: {req.userData.창업동기}
- 마케팅전략: {req.userData.마케팅전략}
- 추진계획: {req.userData.추진계획}
- 팀구성: {req.userData.팀구성}

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