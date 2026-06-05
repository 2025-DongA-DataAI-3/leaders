from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from openai import AsyncOpenAI
from dotenv import load_dotenv
import os

load_dotenv()

router = APIRouter()
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class ChatRequest(BaseModel):
    message: str
    history: list = []  # 이전 대화 내역

SYSTEM_PROMPT = """
너는 THELEADERS 서비스의 창업 전문 AI 어시스턴트야.
예비창업자들이 정부 지원사업 공고를 이해하고, 트렌드를 파악하고,
사업계획서를 준비하는 데 도움을 줘.
항상 친절하고 실용적인 답변을 한국어로 제공해.
"""

async def stream_generator(message: str, history: list):
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    
    # 이전 대화 내역 추가
    for h in history:
        messages.append({"role": h["role"], "content": h["content"]})
    
    # 현재 메시지 추가
    messages.append({"role": "user", "content": message})
    
    stream = await client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        stream=True,
    )
    
    async for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta

@router.post("/chat")
async def chat(req: ChatRequest):
    return StreamingResponse(
        stream_generator(req.message, req.history),
        media_type="text/plain"
    )