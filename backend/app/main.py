from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.utils.auth import get_current_user
from app.services.user_service import UserService
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

# FastAPIアプリケーション作成
app = FastAPI(
    title="BUD Backend API",
    description="子ども英語チャレンジサポートアプリのバックエンドAPI",
    version="1.0.0"
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 開発環境では全て許可
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

# 🔐 認証テスト用エンドポイント
@app.get("/api/auth/test")
async def test_auth(user: Dict[str, Any] = Depends(get_current_user)):
    """
    認証テスト用エンドポイント
    Firebase トークンが正しく検証されるかテスト
    """
    return {
        "message": "🎉 認証成功！",
        "user_info": {
            "user_id": user["user_id"],
            "email": user["email"],
            "name": user["name"],
            "email_verified": user["email_verified"]
        }
    }

# 🚀 Firebase認証統合エンドポイント
@app.post("/api/auth/login")
async def firebase_login(
    user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Firebase認証後の初回ログイン/ユーザー同期
    フロントエンドからFirebaseトークンでアクセス → DBにユーザー情報を同期
    """
    try:
        user_service = UserService(db)
        
        # Firebase認証データからDBユーザーを取得/作成
        db_user = await user_service.get_or_create_user_from_firebase(user)
        
        return {
            "message": "ログイン成功",
            "user": {
                "id": db_user.id,
                "firebase_uid": db_user.firebase_uid,
                "email": db_user.email,
                "full_name": db_user.full_name,
                "username": db_user.username,
                "is_active": db_user.is_active
            }
        }
        
    except Exception as e:
        logger.error(f"Firebase認証統合エラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ログイン処理に失敗しました"
        )

@app.get("/api/auth/profile")
async def get_auth_profile(
    user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    認証済みユーザーのプロフィール情報取得
    """
    try:
        user_service = UserService(db)
        
        profile = await user_service.get_user_profile(user["user_id"])
        
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="ユーザープロフィールが見つかりません"
            )
        
        return {
            "message": "プロフィール取得成功",
            "profile": profile
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"プロフィール取得エラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="プロフィール取得に失敗しました"
        )

@app.put("/api/auth/profile")
async def update_auth_profile(
    profile_data: dict,
    user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    認証済みユーザーのプロフィール情報更新
    """
    try:
        user_service = UserService(db)
        
        updated_user = await user_service.update_user_profile(
            user["user_id"], 
            profile_data
        )
        
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="ユーザーが見つかりません"
            )
        
        return {
            "message": "プロフィール更新成功",
            "user": {
                "id": updated_user.id,
                "email": updated_user.email,
                "full_name": updated_user.full_name,
                "username": updated_user.username,
                "updated_at": updated_user.updated_at.isoformat()
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"プロフィール更新エラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="プロフィール更新に失敗しました"
        )

@app.get("/api/auth/children")
async def get_user_children(
    user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    認証済みユーザーの子ども一覧取得
    """
    try:
        user_service = UserService(db)
        
        db_user = await user_service.get_user_by_firebase_uid(user["user_id"])
        
        if not db_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="ユーザーが見つかりません"
            )
        
        children_data = [
            {
                "id": child.id,
                "name": child.name,
                "birth_date": child.birth_date.isoformat() if child.birth_date else None,
                "grade": child.grade,
                "school": child.school,
                "profile_image": child.profile_image,
                "interests": child.interests,
                "created_at": child.created_at.isoformat()
            }
            for child in db_user.children
        ]
        
        return {
            "message": "子ども一覧取得成功",
            "children": children_data,
            "count": len(children_data)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"子ども一覧取得エラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="子ども一覧取得に失敗しました"
        )

@app.get("/api/profile")
async def get_user_profile(user: Dict[str, Any] = Depends(get_current_user)):
    """
    ユーザープロフィール取得（認証必要）
    """
    return {
        "message": "プロフィール取得成功",
        "profile": user
    }

# 最後に追加
@app.get("/api/test-no-auth")
async def test_no_auth():
    return {"message": "API動作OK!"}