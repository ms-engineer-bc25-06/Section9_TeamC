from fastapi import APIRouter, Depends, HTTPException
from app.utils.auth import get_current_user
from typing import Dict, Any

router = APIRouter()

@router.get("/test")
async def auth_test(current_user: Dict[str, Any] = Depends(get_current_user)):
    """認証テスト用エンドポイント"""
    return {
        "message": "認証テスト成功",
        "user_id": current_user["user_id"],
        "email": current_user["email"],
        "name": current_user["name"]
    }
