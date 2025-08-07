from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

# FastAPIアプリケーション作成
app = FastAPI(
    title="BUD Backend API",
    description="子ども英語チャレンジサポートアプリのバックエンドAPI",
    version="1.0.0"
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_hosts_list,  # config.pyから読み込み
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "BUD Backend API is running"}


@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "service": "bud-backend",
        "version": "1.0.0"
    }