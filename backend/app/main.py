from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.utils.auth import verify_firebase_token
from app.services.user_service import UserService
from app.api.routers import children, auth, ai_feedback
from app.api.voice.transcription import router as voice_router


# Pydanticモデル定義
class LoginRequest(BaseModel):
    idToken: str


app = FastAPI(title="BUD Backend API")

app.add_middleware(
    CORSMiddleware,
   allow_origins=[
        "http://localhost:3000",
        "https://section9-team-c.vercel.app",
        "https://section9-team-c-five.vercel.app",  
        "https://section9-team-note92ivo-ryokomatsumoto929s-projects.vercel.app", 
        "https://*.vercel.app",
        "https://*.ngrok.io",
        "https://*.ngrok-free.app",
        "https://*.loca.lt", 
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "bud-backend"}


@app.post("/api/auth/login")
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    try:
        token = request.idToken
        if not token:
            raise HTTPException(status_code=400, detail="idToken is required")

        # Firebase トークン検証（修正）
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
                "firebase_uid": user.firebase_uid,
            }
        }

    except Exception as e:
        print(f"Firebase認証統合エラー: {e}")
        raise HTTPException(status_code=500, detail="ログイン処理に失敗しました")


# API ルーター
app.include_router(children.router, prefix="/api/children", tags=["children"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(ai_feedback.router, prefix="/api")

# Voice Transcription API
app.include_router(voice_router)