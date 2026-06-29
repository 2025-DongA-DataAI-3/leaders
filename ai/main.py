from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import business_plan 
from routers import chat
from routers import business_plan


app = FastAPI(title="THELEADERS AI Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://unvituperatively-cytological-rhona.ngrok-free.dev",
        "https://defectless-nonconjunctively-cesar.ngrok-free.dev",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api/ai", tags=["chat"]) # 챗봇
app.include_router(business_plan.router, prefix="/api/business-plan", tags=["business-plan"])

@app.get("/")
def root():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)