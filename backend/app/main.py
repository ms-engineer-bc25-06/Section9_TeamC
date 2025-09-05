from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.routers import ai_feedback, auth, children, logging_control
from app.api.routers.voice import router as voice_router
from app.core.database import get_db
from app.utils.auth import verify_firebase_token
from app.core.logging_config import get_logger, setup_logging
from app.core.monitoring_task import start_monitoring
from app.middleware.error_handler import ErrorHandlerMiddleware
from app.middleware.performance_monitoring import PerformanceMonitoringMiddleware
from app.middleware.traceability_logging import TraceabilityMiddleware
from app.services.user_service import UserService

# ログ設定の初期化
setup_logging()
logger = get_logger(__name__)

# 監視システム開始
start_monitoring()


# Pydanticモデル定義
class LoginRequest(BaseModel):
    idToken: str


app = FastAPI(title="BUD Backend API")

# ミドルウェアを追加（順序重要：トレーサビリティ → 性能測定 → エラーハンドリング）
app.add_middleware(TraceabilityMiddleware)
app.add_middleware(PerformanceMonitoringMiddleware)
app.add_middleware(ErrorHandlerMiddleware)

app.add_middleware(
    CORSMiddleware,
   allow_origins=[
        "http://localhost:3000",
        "https://section9-team-c.vercel.app",
        "https://*.vercel.app",
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
                "firebase_uid": user.firebase_uid,
            }
        }

    except Exception as error:
        print(f"Firebase認証統合エラー: {error}")
        raise HTTPException(status_code=500, detail="ログイン処理に失敗しました")


# API ルーター
app.include_router(children.router, prefix="/api/children", tags=["children"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(ai_feedback.router, prefix="/api")
app.include_router(logging_control.router, prefix="/api/admin", tags=["admin"])

# Voice Transcription API
app.include_router(voice_router)
