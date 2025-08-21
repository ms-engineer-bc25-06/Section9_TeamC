from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession  # 非同期Session
from sqlalchemy import text  # テキストクエリ用
from app.core.database import get_db, database
from app.core.config import settings
import time
import psutil
from datetime import datetime, timezone

router = APIRouter()


@router.get("/")
async def health_check():
    """基本的なヘルスチェック"""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
    }


@router.get("/detailed")
async def detailed_health_check(db: AsyncSession = Depends(get_db)):
    """詳細なヘルスチェック（DB接続・システム情報含む）"""
    start_time = time.time()

    # ヘルスチェック結果の初期化
    health_status = {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "checks": {},
    }

    # データベース接続チェック（非同期）
    try:
        await db.execute(text("SELECT 1"))  # 非同期でテストクエリ実行
        db_status = "healthy"
        db_response_time = round((time.time() - start_time) * 1000, 2)  # レスポンス時間計測
    except Exception:
        db_status = "unhealthy"
        db_response_time = None
        health_status["status"] = "unhealthy"

    health_status["checks"]["database"] = {
        "status": db_status,
        "response_time_ms": db_response_time,
    }

    # 非同期データベース接続チェック
    try:
        await database.execute("SELECT 1")
        async_db_status = "healthy"
    except Exception:
        async_db_status = "unhealthy"
        health_status["status"] = "unhealthy"

    health_status["checks"]["async_database"] = {"status": async_db_status}

    # システムリソース情報を取得
    health_status["system"] = {
        "cpu_percent": psutil.cpu_percent(),  # CPU使用率
        "memory_percent": psutil.virtual_memory().percent,  # メモリ使用率
        "disk_percent": psutil.disk_usage("/").percent,  # ディスク使用率
    }

    # 異常時は503エラーを返す
    if health_status["status"] == "unhealthy":
        raise HTTPException(status_code=503, detail=health_status)

    return health_status


@router.get("/readiness")
async def readiness_check(db: AsyncSession = Depends(get_db)):
    """アプリケーションの準備状態チェック（Kubernetes等で使用）"""
    try:
        # データベース接続確認
        await db.execute(text("SELECT 1"))
        return {"status": "ready"}
    except Exception as e:
        # DB接続失敗時は準備未完了
        raise HTTPException(status_code=503, detail={"status": "not ready", "error": str(e)})


@router.get("/liveness")
async def liveness_check():
    """アプリケーションの生存確認（Kubernetes等で使用）"""
    return {"status": "alive", "timestamp": datetime.now(timezone.utc).isoformat()}
