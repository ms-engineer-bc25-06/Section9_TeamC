from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.database import get_async_db, async_engine
from app.core.config import settings
import time
import psutil
from datetime import datetime, timezone
from typing import Dict, Any

router = APIRouter()


@router.get("/")
async def health_check() -> Dict[str, Any]:
    """基本的なヘルスチェック"""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
    }


@router.get("/detailed")
async def detailed_health_check(db: AsyncSession = Depends(get_async_db)) -> Dict[str, Any]:
    """詳細なヘルスチェック（DB接続・システム情報含む）"""
    start_time = time.time()

    # ヘルスチェック結果の初期化
    health_status: Dict[str, Any] = {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "checks": {},
    }

    # データベース接続チェック（非同期）
    try:
        await db.execute(text("SELECT 1"))
        db_status = "healthy"
        db_response_time = round((time.time() - start_time) * 1000, 2)
    except Exception:
        db_status = "unhealthy"
        db_response_time = None
        health_status["status"] = "unhealthy"

    health_status["checks"]["database"] = {
        "status": db_status,
        "response_time_ms": db_response_time,
    }

    # 非同期エンジン接続チェック
    try:
        async with async_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        async_db_status = "healthy"
    except Exception:
        async_db_status = "unhealthy"
        health_status["status"] = "unhealthy"

    health_status["checks"]["async_database"] = {"status": async_db_status}

    # システムリソース情報を取得
    health_status["system"] = {
        "cpu_percent": psutil.cpu_percent(),
        "memory_percent": psutil.virtual_memory().percent,
        "disk_percent": psutil.disk_usage("/").percent,
    }

    # 異常時は503エラーを返す
    if health_status["status"] == "unhealthy":
        raise HTTPException(status_code=503, detail=health_status)

    return health_status


@router.get("/readiness")
async def readiness_check(db: AsyncSession = Depends(get_async_db)) -> Dict[str, str]:
    """アプリケーションの準備状態チェック（Kubernetes等で使用）"""
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "ready"}
    except Exception as e:
        raise HTTPException(status_code=503, detail={"status": "not ready", "error": str(e)})


@router.get("/liveness")
async def liveness_check() -> Dict[str, str]:
    """アプリケーションの生存確認（Kubernetes等で使用）"""
    return {"status": "alive", "timestamp": datetime.now(timezone.utc).isoformat()}
