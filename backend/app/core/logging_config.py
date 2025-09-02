"""ログ設定 - サーバー状態の適切なモニタリング"""

import logging
import logging.handlers
import os
from datetime import datetime
from pathlib import Path

# ログディレクトリの作成
LOG_DIR = Path("logs")
LOG_DIR.mkdir(exist_ok=True)

# ログレベルの設定（環境変数から取得）
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

def setup_logging():
    """アプリケーション全体のログ設定"""
    
    # ルートロガーの設定
    root_logger = logging.getLogger()
    root_logger.setLevel(LOG_LEVEL)
    
    # フォーマッターの定義
    detailed_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s'
    )
    
    simple_formatter = logging.Formatter(
        '%(asctime)s - %(levelname)s - %(message)s'
    )
    
    # コンソールハンドラー（開発環境用）
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(simple_formatter)
    
    # ファイルハンドラー（全ログ）
    file_handler = logging.handlers.RotatingFileHandler(
        LOG_DIR / 'app.log',
        maxBytes=10485760,  # 10MB
        backupCount=5,
        encoding='utf-8'
    )
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(detailed_formatter)
    
    # エラーログ専用ハンドラー
    error_handler = logging.handlers.RotatingFileHandler(
        LOG_DIR / 'error.log',
        maxBytes=10485760,  # 10MB
        backupCount=5,
        encoding='utf-8'
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(detailed_formatter)
    
    # アクセスログハンドラー
    access_handler = logging.handlers.RotatingFileHandler(
        LOG_DIR / 'access.log',
        maxBytes=10485760,  # 10MB
        backupCount=5,
        encoding='utf-8'
    )
    access_handler.setLevel(logging.INFO)
    access_handler.setFormatter(simple_formatter)
    
    # ハンドラーをロガーに追加
    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)
    root_logger.addHandler(error_handler)
    
    # アクセスログ用の専用ロガー
    access_logger = logging.getLogger("access")
    access_logger.addHandler(access_handler)
    access_logger.propagate = False
    
    # uvicornのログレベル調整
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)
    
    return root_logger

# ログカテゴリ別のロガー取得関数
def get_logger(name: str) -> logging.Logger:
    """カテゴリ別のロガーを取得"""
    return logging.getLogger(name)

# サーバー状態ログ関数
def log_server_status(cpu_percent: float, memory_percent: float, disk_percent: float):
    """サーバーリソース状態をログに記録"""
    logger = get_logger("monitoring")
    logger.info(
        f"Server Status - CPU: {cpu_percent}%, Memory: {memory_percent}%, Disk: {disk_percent}%"
    )
    
    # 警告レベルの判定
    if cpu_percent > 80:
        logger.warning(f"High CPU usage detected: {cpu_percent}%")
    if memory_percent > 80:
        logger.warning(f"High memory usage detected: {memory_percent}%")
    if disk_percent > 90:
        logger.critical(f"Critical disk usage: {disk_percent}%")