"""アプリケーション定数"""

# APIレスポンス設定
API_CONFIG = {
    "VERSION": "1.0.0",
    "TIMEOUT": 30,
    "MAX_CONTENT_LENGTH": 16 * 1024 * 1024,  # 16MB
}

# ページネーション設定
PAGINATION = {
    "DEFAULT_LIMIT": 20,
    "MAX_LIMIT": 100,
}

# 音声処理設定
VOICE_CONFIG = {
    "MAX_DURATION": 300,  # 5分
    "SUPPORTED_FORMATS": ["webm", "mp4", "wav", "m4a"],
    "MAX_FILE_SIZE": 10 * 1024 * 1024,  # 10MB
}

# AI処理設定
AI_CONFIG = {
    "MAX_TOKENS": 400,
    "TEMPERATURE": 0.0,
    "MODEL": "gpt-4o-mini",
    "FEEDBACK_MAX_LENGTH": 200,
}

# セキュリティ設定
SECURITY_CONFIG = {
    "TOKEN_EXPIRE_MINUTES": 60,
    "RATE_LIMIT": {
        "DEFAULT": 100,  # per minute
        "VOICE": 10,  # per hour
        "AUTH": 5,  # per minute
    },
}
