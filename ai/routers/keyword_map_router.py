"""
keyword_map_router.py
FastAPI 라우터 — 키워드맵 엔드포인트
비즈니스 로직은 keyword_service / market_service 에서 담당
"""

from fastapi import APIRouter
from routers.keyword_service import get_keyword_map_data
from routers.market_service  import generate_market_analysis

router = APIRouter()


@router.get("/api/keyword-map")
def get_keyword_map():
    return get_keyword_map_data()


@router.get("/api/keyword-map/market-analysis/{keyword}")
async def get_market_analysis(keyword: str, reason: str = ""):
    text = await generate_market_analysis(keyword, reason)
    return {"keyword": keyword, "market_analysis": text}