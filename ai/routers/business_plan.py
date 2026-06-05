from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from openai import AsyncOpenAI
from dotenv import load_dotenv
import olefile
import os
import glob

load_dotenv()

router = APIRouter()
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

import os
HWP_FOLDER = os.path.join(os.path.dirname(__file__), "../hwp_files")

@router.get("/debug")
def debug_path():
    hwp_path = os.path.join(HWP_FOLDER, "003_창업_사업계획서_양식.hwp")
    try:
        files = os.listdir(os.path.normpath(HWP_FOLDER))
    except Exception as e:
        files = str(e)
    
    return {
        "HWP_FOLDER": HWP_FOLDER,
        "hwp_path": hwp_path,
        "exists": os.path.exists(hwp_path),
        "files_in_folder": files
    }

# HWP에서 텍스트 추출 함수
def extract_hwp_text(hwp_path: str) -> str:
    try:
        f = olefile.OleFileIO(hwp_path)
        data = f.openstream('PrvText').read()
        return data.decode('utf-16-le', errors='ignore')
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"HWP 파싱 실패: {str(e)}")

# 폴더의 모든 HWP 파일 목록 반환
@router.get("/templates")
def get_templates():
    hwp_files = glob.glob(f"{HWP_FOLDER}/*.hwp")
    return {
        "templates": [
            {"id": i, "name": os.path.basename(f), "path": f}
            for i, f in enumerate(hwp_files)
        ]
    }

class BusinessPlanRequest(BaseModel):
    template_name: str       # HWP 파일명 (예: "001_사업계획서_양식.hwp")
    user_idea: str
    service_description: str
    target_customer: str
    news_summary: str         # 트렌드 데이터
    announcement_title: str   # 공고명
    announcement_content: str # 공고 내용

SYSTEM_PROMPT = """
# 역할
당신은 창업진흥원 및 중소벤처기업부 사업계획서 평가위원이다.
사용자가 제공한 사업계획서 양식을 분석하고, 뉴스 트렌드 데이터와 
지원공고 데이터를 활용하여 해당 양식에 맞는 사업계획서를 작성한다.

# 제약조건
* 사용자가 제공한 양식의 항목 제목과 순서를 변경하지 않는다.
* 양식에 없는 항목을 임의로 추가하지 않는다.
* 뉴스 데이터와 공고 데이터를 근거로 작성한다.
* 추상적인 표현을 금지한다.
* 실제 심사위원이 검토하는 수준으로 작성한다.

# 출력형식
사업계획서 본문만 출력한다. JSON 출력 금지. 설명 출력 금지.
"""

async def stream_business_plan(req: BusinessPlanRequest, template_text: str):
    user_prompt = f"""
[사업계획서 양식]
{template_text}

[지원공고 정보]
공고명: {req.announcement_title}
공고 내용: {req.announcement_content}

[뉴스 트렌드 데이터]
{req.news_summary}

[사용자 정보]
창업 아이디어: {req.user_idea}
서비스 설명: {req.service_description}
타겟 고객: {req.target_customer}

위 양식의 모든 항목을 실제 정부지원사업 제출 수준으로 작성하시오.
"""

    stream = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.7,
        stream=True
    )

    async for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta

@router.post("/generate")
async def generate_business_plan(req: BusinessPlanRequest):
    hwp_path = os.path.join(HWP_FOLDER, req.template_name)
    
    if not os.path.exists(hwp_path):
        raise HTTPException(status_code=404, detail="양식 파일을 찾을 수 없습니다.")
    
    template_text = extract_hwp_text(hwp_path)
    
    return StreamingResponse(
        stream_business_plan(req, template_text),
        media_type="text/plain"
    )