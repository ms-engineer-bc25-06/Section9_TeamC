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

# =====================================
# デモ用メモリストレージ
temp_children = []

@app.get("/api/children")
async def get_children():
    """子ども一覧取得（デモ用）"""
    return temp_children

@app.post("/api/children")
async def create_child(child_data: dict):
    """子ども登録（デモ用）"""
    new_child = {
        "id": len(temp_children) + 1,
        "name": child_data["name"],
        "age": child_data.get("age", 5),
        "created_at": "2025-08-08"
    }
    temp_children.append(new_child)
    return new_child
# ===================================