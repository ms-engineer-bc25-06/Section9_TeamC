"""HTTPステータスコード定数 - マジックナンバー排除"""

from enum import IntEnum


class HTTPStatus(IntEnum):
    """HTTPステータスコード"""
    # 成功
    OK = 200
    CREATED = 201
    NO_CONTENT = 204
    
    # クライアントエラー
    BAD_REQUEST = 400
    UNAUTHORIZED = 401
    FORBIDDEN = 403
    NOT_FOUND = 404
    METHOD_NOT_ALLOWED = 405
    CONFLICT = 409
    UNPROCESSABLE_ENTITY = 422
    
    # サーバーエラー
    INTERNAL_SERVER_ERROR = 500
    NOT_IMPLEMENTED = 501
    BAD_GATEWAY = 502
    SERVICE_UNAVAILABLE = 503


class ErrorContext:
    """エラーコンテキスト定数"""
    USER_NOT_FOUND = "ユーザーが見つかりません"
    CHILD_NOT_FOUND = "子ども情報が見つかりません"
    TRANSCRIPTION_FAILED = "文字起こしに失敗しました"
    AI_FEEDBACK_FAILED = "AIフィードバック生成に失敗しました"
    UNAUTHORIZED_ACCESS = "アクセス権限がありません"
    INVALID_TOKEN = "無効なトークンです"
    DATABASE_ERROR = "データベースエラーが発生しました"