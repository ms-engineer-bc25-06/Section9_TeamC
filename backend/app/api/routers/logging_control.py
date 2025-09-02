"""ログレベル制御API - 実行時のログレベル変更"""

from fastapi import APIRouter
from pydantic import BaseModel
import logging
import os
from typing import List
from app.core.logging_config import get_logger

router = APIRouter()
logger = get_logger(__name__)

class LogLevelRequest(BaseModel):
    level: str

class LogLevelResponse(BaseModel):
    current_level: str
    available_levels: List[str]
    message: str

@router.get("/log-level", response_model=LogLevelResponse)
async def get_current_log_level():
    """現在のログレベルを取得"""
    current_level = logging.getLogger().getEffectiveLevel()
    level_name = logging.getLevelName(current_level)
    
    return LogLevelResponse(
        current_level=level_name,
        available_levels=["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"],
        message=f"Current log level: {level_name}"
    )

@router.post("/log-level", response_model=LogLevelResponse) 
async def set_log_level(request: LogLevelRequest):
    """ログレベルを変更（実行時）"""
    level = request.level.upper()
    
    # 有効なログレベルかチェック
    valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
    if level not in valid_levels:
        return LogLevelResponse(
            current_level=logging.getLevelName(logging.getLogger().getEffectiveLevel()),
            available_levels=valid_levels,
            message=f"Invalid log level: {level}. Use one of {valid_levels}"
        )
    
    # ログレベルを変更
    numeric_level = getattr(logging, level)
    logging.getLogger().setLevel(numeric_level)
    
    # 環境変数も更新（現在のプロセスのみ）
    os.environ["LOG_LEVEL"] = level
    
    logger.info(f"Log level changed to {level}")
    
    return LogLevelResponse(
        current_level=level,
        available_levels=valid_levels,
        message=f"Log level successfully changed to {level}"
    )

@router.post("/test-logs")
async def test_log_output():
    """全レベルのログをテスト出力"""
    test_logger = get_logger("test")
    
    test_logger.debug("🔍 This is a DEBUG message")
    test_logger.info("ℹ️ This is an INFO message")
    test_logger.warning("⚠️ This is a WARNING message")
    test_logger.error("❌ This is an ERROR message")
    test_logger.critical("🚨 This is a CRITICAL message")
    
    current_level = logging.getLevelName(logging.getLogger().getEffectiveLevel())
    
    return {
        "message": "Test logs sent at all levels",
        "current_level": current_level,
        "note": f"Only logs at {current_level} level and above will be visible"
    }