from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import chat, business_plan 
from routers import chat

app = FastAPI(title="THELEADERS AI Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite 프론트 주소
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api/ai", tags=["chat"]) # 챗봇
app.include_router(business_plan.router, prefix="/api/ai/business-plan", tags=["business-plan"])  #사업계획서 양식 파싱

@app.get("/")
def root():
    return {"status": "ok"}