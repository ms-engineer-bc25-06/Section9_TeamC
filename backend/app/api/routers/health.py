import time
from datetime import datetime, timezone

import psutil
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text  # テキストクエリ用
from sqlalchemy.ext.asyncio import AsyncSession  # 非同期Session

from app.core.cache import get_cache_stats
from app.core.config import settings
from app.core.database import database, get_db
from app.core.logging_config import get_logger, log_server_status
from app.core.resource_monitor import get_resource_summary, resource_monitor

router = APIRouter()
logger = get_logger(__name__)


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
        "performance_requirements": {
            "response_time_target_ms": 200,
            "throughput_target_req_sec": 100,
            "error_rate_target_percent": 0.1,
            "availability_target_percent": 99.5,
        },
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
    cpu_percent = psutil.cpu_percent()
    memory_percent = psutil.virtual_memory().percent
    disk_percent = psutil.disk_usage("/").percent

    health_status["system"] = {
        "cpu_percent": cpu_percent,  # CPU使用率
        "memory_percent": memory_percent,  # メモリ使用率
        "disk_percent": disk_percent,  # ディスク使用率
    }

    # サーバー状態をログに記録
    log_server_status(cpu_percent, memory_percent, disk_percent)
    logger.info(f"Health check performed - Status: {health_status['status']}")

    # リソース監視とアラート
    resource_summary = get_resource_summary()
    alerts = resource_monitor.check_resource_alerts(resource_summary["system_resources"])

    # キャッシュ統計
    cache_stats = get_cache_stats()

    # 詳細情報を追加
    health_status["resource_monitoring"] = {
        "memory_usage_percent": memory_percent,
        "cpu_usage_percent": cpu_percent,
        "disk_usage_percent": disk_percent,
        "active_alerts": alerts,
        "cache_stats": cache_stats,
    }

    # 異常時は503エラーを返す
    if health_status["status"] == "unhealthy" or alerts:
        if alerts:
            health_status["status"] = "degraded"
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
