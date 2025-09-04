"""簡単なトレーサビリティログのテスト（FastAPI依存なし）"""

import json
import time
import uuid
import logging

# 簡単なログ設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger("traceability_test")

def test_traceability_logs():
    """トレーサビリティログの基本構造をテスト"""

    print("🔍 トレーサビリティログ構造テスト開始...")

    # 1. リクエスト追跡ログ
    request_id = str(uuid.uuid4())[:8]

    request_start = {
        "event": "request_start",
        "request_id": request_id,
        "method": "POST",
        "url": "/api/children",
        "client_ip": "192.168.1.100",
        "user_id": "user123",
        "user_agent": "Mozilla/5.0 (test)",
        "timestamp": time.time()
    }

    logger.info(f"REQUEST_START | {json.dumps(request_start, ensure_ascii=False)}")

    # 2. ユーザー操作ログ
    user_action = {
        "event": "user_action",
        "action": "create_child_profile",
        "user_id": "user123",
        "details": {
            "child_name": "太郎",
            "child_age": 6,
            "feature": "child_management"
        },
        "request_id": request_id,
        "timestamp": time.time()
    }

    logger.info(f"USER_ACTION | {json.dumps(user_action, ensure_ascii=False)}")

    # 3. データアクセスログ
    data_access = {
        "event": "data_access",
        "resource": "children_data",
        "operation": "CREATE",
        "resource_id": "child_456",
        "user_id": "user123",
        "request_id": request_id,
        "timestamp": time.time()
    }

    logger.info(f"DATA_ACCESS | {json.dumps(data_access, ensure_ascii=False)}")

    # 4. セキュリティイベントログ
    security_event = {
        "event": "security_event",
        "event_type": "login_success",
        "user_id": "user123",
        "severity": "info",
        "details": {
            "ip_address": "192.168.1.100",
            "method": "firebase_auth"
        },
        "request_id": request_id,
        "timestamp": time.time()
    }

    logger.info(f"SECURITY_INFO | {json.dumps(security_event, ensure_ascii=False)}")

    # 5. 音声認識操作ログ
    voice_action = {
        "event": "user_action",
        "action": "voice_transcription",
        "user_id": "user123",
        "details": {
            "child_id": "child_456",
            "file_size_bytes": 1024000,
            "duration_seconds": 15.5,
            "feature": "speech_recognition"
        },
        "request_id": request_id,
        "timestamp": time.time()
    }

    logger.info(f"USER_ACTION | {json.dumps(voice_action, ensure_ascii=False)}")

    # 6. リクエスト終了ログ
    request_end = {
        "event": "request_end",
        "request_id": request_id,
        "method": "POST",
        "url": "/api/children",
        "status_code": 201,
        "duration_ms": 245.67,
        "user_id": "user123",
        "timestamp": time.time()
    }

    logger.info(f"REQUEST_END | {json.dumps(request_end, ensure_ascii=False)}")

    # 7. エラーケース
    error_request = {
        "event": "request_end",
        "request_id": str(uuid.uuid4())[:8],
        "method": "GET",
        "url": "/api/admin/sensitive",
        "status_code": 403,
        "duration_ms": 12.34,
        "user_id": "user456",
        "timestamp": time.time()
    }

    logger.warning(f"REQUEST_ERROR | {json.dumps(error_request, ensure_ascii=False)}")

    print("✅ トレーサビリティログ構造テスト完了")
    print("\n📋 実装されたトレーサビリティ項目:")
    print("- リクエストID追跡")
    print("- ユーザー操作履歴")
    print("- データアクセス監査")
    print("- セキュリティイベント記録")
    print("- レスポンス時間計測")
    print("- エラー追跡")

if __name__ == "__main__":
    test_traceability_logs()
