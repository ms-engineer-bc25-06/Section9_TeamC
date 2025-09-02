"""トレーサビリティ対応ログミドルウェア - リクエスト追跡とユーザー操作ログ"""

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
import uuid
import time
import json
from typing import Optional
from app.core.logging_config import get_logger
from app.core.alert_monitor import record_error, record_security_warning, record_auth_failure, record_slow_request

logger = get_logger("traceability")

class TraceabilityMiddleware(BaseHTTPMiddleware):
    """リクエスト追跡とユーザー操作のトレーサビリティログ"""
    
    async def dispatch(self, request: Request, call_next):
        # リクエストIDを生成
        request_id = str(uuid.uuid4())[:8]
        start_time = time.time()
        
        # リクエスト情報を取得
        client_ip = self.get_client_ip(request)
        user_agent = request.headers.get("user-agent", "")
        method = request.method
        url = str(request.url)
        
        # 認証情報の取得（可能であれば）
        user_id = self.extract_user_info(request)
        
        # リクエスト開始ログ
        self.log_request_start(request_id, method, url, client_ip, user_id, user_agent)
        
        # リクエスト処理
        response = await call_next(request)
        
        # 処理時間計算
        duration = time.time() - start_time
        duration_ms = duration * 1000
        
        # アラート監視メトリクス記録
        if response.status_code >= 500:
            record_error()
        elif response.status_code >= 400:
            if response.status_code == 401 or response.status_code == 403:
                record_auth_failure()
        
        # 遅いリクエストの記録
        record_slow_request(duration_ms)
        
        # レスポンス完了ログ
        self.log_request_end(request_id, method, url, response.status_code, duration, user_id)
        
        # レスポンスヘッダーにリクエストIDを追加
        response.headers["X-Request-ID"] = request_id
        
        return response
    
    def get_client_ip(self, request: Request) -> str:
        """クライアントIPアドレスを取得"""
        # プロキシ経由の場合のIP取得
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip
        
        return request.client.host if request.client else "unknown"
    
    def extract_user_info(self, request: Request) -> Optional[str]:
        """リクエストからユーザー情報を抽出"""
        try:
            # Authorizationヘッダーからユーザー情報を推定
            auth_header = request.headers.get("authorization", "")
            if auth_header.startswith("Bearer "):
                # 実際のJWT解析は省略し、ダミーのユーザーIDを返す
                # 本番では適切なJWT解析を実装
                return "user_from_token"
            
            # その他の認証方法があれば追加
            return None
        except Exception:
            return None
    
    def log_request_start(self, request_id: str, method: str, url: str, 
                         client_ip: str, user_id: Optional[str], user_agent: str):
        """リクエスト開始ログ"""
        log_data = {
            "event": "request_start",
            "request_id": request_id,
            "method": method,
            "url": url,
            "client_ip": client_ip,
            "user_id": user_id or "anonymous",
            "user_agent": user_agent[:200],  # 長すぎるUser-Agentを短縮
            "timestamp": time.time()
        }
        
        logger.info(f"REQUEST_START | {json.dumps(log_data, ensure_ascii=False)}")
    
    def log_request_end(self, request_id: str, method: str, url: str, 
                       status_code: int, duration: float, user_id: Optional[str]):
        """リクエスト完了ログ"""
        log_data = {
            "event": "request_end",
            "request_id": request_id,
            "method": method,
            "url": url,
            "status_code": status_code,
            "duration_ms": round(duration * 1000, 2),
            "user_id": user_id or "anonymous",
            "timestamp": time.time()
        }
        
        # エラーレスポンスは警告レベル
        if status_code >= 400:
            logger.warning(f"REQUEST_ERROR | {json.dumps(log_data, ensure_ascii=False)}")
        else:
            logger.info(f"REQUEST_END | {json.dumps(log_data, ensure_ascii=False)}")

class UserActionLogger:
    """ユーザー操作の追跡ログ"""
    
    @staticmethod
    def log_user_action(action: str, user_id: str, details: dict = None, 
                       request_id: str = None):
        """ユーザー操作をログ記録"""
        log_data = {
            "event": "user_action",
            "action": action,
            "user_id": user_id,
            "details": details or {},
            "request_id": request_id,
            "timestamp": time.time()
        }
        
        logger.info(f"USER_ACTION | {json.dumps(log_data, ensure_ascii=False)}")
    
    @staticmethod
    def log_data_access(resource: str, user_id: str, operation: str, 
                       resource_id: str = None, request_id: str = None):
        """データアクセスの追跡"""
        log_data = {
            "event": "data_access",
            "resource": resource,
            "operation": operation,  # CREATE, READ, UPDATE, DELETE
            "resource_id": resource_id,
            "user_id": user_id,
            "request_id": request_id,
            "timestamp": time.time()
        }
        
        logger.info(f"DATA_ACCESS | {json.dumps(log_data, ensure_ascii=False)}")
    
    @staticmethod
    def log_security_event(event_type: str, user_id: str, details: dict = None,
                          severity: str = "info", request_id: str = None):
        """セキュリティイベントの記録"""
        log_data = {
            "event": "security_event",
            "event_type": event_type,  # login_success, login_failure, unauthorized_access
            "user_id": user_id,
            "severity": severity,
            "details": details or {},
            "request_id": request_id,
            "timestamp": time.time()
        }
        
        # アラート監視用のセキュリティ警告記録
        if severity in ["warning", "critical"]:
            record_security_warning()
            
        if severity == "critical":
            logger.critical(f"SECURITY_CRITICAL | {json.dumps(log_data, ensure_ascii=False)}")
        elif severity == "warning":
            logger.warning(f"SECURITY_WARNING | {json.dumps(log_data, ensure_ascii=False)}")
        else:
            logger.info(f"SECURITY_INFO | {json.dumps(log_data, ensure_ascii=False)}")

# グローバルインスタンス
user_logger = UserActionLogger()

# 使用例の関数
def log_authentication(user_id: str, success: bool, ip_address: str, request_id: str = None):
    """認証イベントのログ"""
    if success:
        user_logger.log_security_event(
            "login_success", 
            user_id, 
            {"ip_address": ip_address}, 
            "info",
            request_id
        )
    else:
        user_logger.log_security_event(
            "login_failure", 
            user_id or "unknown", 
            {"ip_address": ip_address}, 
            "warning",
            request_id
        )

def log_voice_transcription(user_id: str, child_id: str, file_size: int, request_id: str = None):
    """音声認識操作のログ"""
    user_logger.log_user_action(
        "voice_transcription",
        user_id,
        {
            "child_id": child_id,
            "file_size_bytes": file_size,
            "feature": "speech_recognition"
        },
        request_id
    )

def log_child_data_access(user_id: str, operation: str, child_id: str = None, request_id: str = None):
    """子どもデータへのアクセスログ"""
    user_logger.log_data_access(
        "children_data",
        user_id,
        operation,
        child_id,
        request_id
    )