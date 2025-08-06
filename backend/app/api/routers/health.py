from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db, database
from app.core.config import settings
import time
import psutil
from datetime import datetime

router = APIRouter()


@router.get("/")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
    }


@router.get("/detailed")
async def detailed_health_check(db: Session = Depends(get_db)):
    start_time = time.time()

    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "checks": {},
    }

    try:
        db.execute("SELECT 1")
        db_status = "healthy"
        db_response_time = round((time.time() - start_time) * 1000, 2)
    except Exception as e:
        db_status = "unhealthy"
        db_response_time = None
        health_status["status"] = "unhealthy"

    health_status["checks"]["database"] = {
        "status": db_status,
        "response_time_ms": db_response_time,
    }

    try:
        await database.execute("SELECT 1")
        async_db_status = "healthy"
    except Exception as e:
        async_db_status = "unhealthy"
        health_status["status"] = "unhealthy"

    health_status["checks"]["async_database"] = {"status": async_db_status}

    health_status["system"] = {
        "cpu_percent": psutil.cpu_percent(),
        "memory_percent": psutil.virtual_memory().percent,
        "disk_percent": psutil.disk_usage("/").percent,
    }

    if health_status["status"] == "unhealthy":
        raise HTTPException(status_code=503, detail=health_status)

    return health_status


@router.get("/readiness")
async def readiness_check(db: Session = Depends(get_db)):
    try:
        db.execute("SELECT 1")
        return {"status": "ready"}
    except Exception as e:
        raise HTTPException(
            status_code=503, detail={"status": "not ready", "error": str(e)}
        )


@router.get("/liveness")
async def liveness_check():
    return {"status": "alive", "timestamp": datetime.utcnow().isoformat()}
