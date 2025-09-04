"""トレーサビリティログのテスト実行"""

import sys
sys.path.append('.')

from app.core.logging_config import setup_logging
from app.middleware.traceability_logging import user_logger, log_authentication, log_voice_transcription, log_child_data_access

# ログ設定
setup_logging()

def test_traceability_logging():
    """トレーサビリティログのテスト"""

    print("🔍 トレーサビリティログのテスト開始...")

    # 1. ユーザー認証ログ
    print("1. 認証成功ログ")
    log_authentication("user123", True, "192.168.1.100", "req_001")

    print("2. 認証失敗ログ")
    log_authentication("user456", False, "192.168.1.200", "req_002")

    # 3. ユーザー操作ログ
    print("3. ユーザー操作ログ")
    user_logger.log_user_action(
        "page_view",
        "user123",
        {"page": "/children", "referrer": "/dashboard"},
        "req_003"
    )

    # 4. データアクセスログ
    print("4. データアクセスログ")
    log_child_data_access("user123", "READ", "child_001", "req_004")
    log_child_data_access("user123", "UPDATE", "child_001", "req_005")

    # 5. 音声認識操作ログ
    print("5. 音声認識ログ")
    log_voice_transcription("user123", "child_001", 1024000, "req_006")

    # 6. セキュリティイベントログ
    print("6. セキュリティイベントログ")
    user_logger.log_security_event(
        "unauthorized_access",
        "user789",
        {"attempted_resource": "/api/admin", "ip_address": "10.0.0.1"},
        "warning",
        "req_007"
    )

    print("✅ トレーサビリティログテスト完了")
    print("📄 ログファイルを確認: backend/logs/app.log")

if __name__ == "__main__":
    test_traceability_logging()
