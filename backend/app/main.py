from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.utils.auth import verify_firebase_token
from app.services.user_service import UserService
import os

# Pydanticモデル定義
class LoginRequest(BaseModel):
    idToken: str

app = FastAPI(title="BUD Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "bud-backend"}

@app.post("/api/auth/login")
async def login(
    request: LoginRequest,
    db: Session = Depends(get_db)
):
    try:
        token = request.idToken
        if not token:
            raise HTTPException(status_code=400, detail="idToken is required")
        
        # Firebase トークン検証
        decoded_token = await verify_firebase_token(token)
        uid = decoded_token["uid"]
        email = decoded_token.get("email", "")
        name = decoded_token.get("name", "")
        
        print(f"✅ 認証成功: {email}")
        
        # ユーザー取得/作成
        user_service = UserService(db)
        user = await user_service.get_or_create_user_from_firebase(uid, email, name)
        
        return {
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "firebase_uid": user.firebase_uid
            }
        }
        
    except Exception as e:
        print(f"Firebase認証統合エラー: {e}")
        raise HTTPException(status_code=500, detail="ログイン処理に失敗しました")

<<<<<<< HEAD
@app.get("/api/auth/profile")
async def get_auth_profile(
    user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
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
    db: AsyncSession = Depends(get_db)
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
    db: AsyncSession = Depends(get_db)
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
        
        children = await user_service.get_user_children(db_user["id"])
        
        children_data = [
            {
                "id": child["id"],
                "name": child["name"],
                "nickname": child["nickname"],
                "grade": child["grade"],
                "display_name": child["nickname"] + "ちゃん　" + (child["grade"] or ""),
                "created_at": child["created_at"]
            }
            for child in children
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

# Voice Transcription API
from app.api.voice.transcription import router as voice_router
app.include_router(voice_router)

# Children Management API
from app.api.routers.children import router as children_router
app.include_router(children_router, prefix="/api/children", tags=["children"])
=======
from app.api.routers import children
app.include_router(children.router, prefix="/api/children", tags=["children"])
>>>>>>> develop
