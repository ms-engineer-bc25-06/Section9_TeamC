"""統一エラーハンドリングミドルウェア"""

from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.exc import SQLAlchemyError
from app.constants.messages import ERROR_MESSAGES
import traceback
import logging

logger = logging.getLogger(__name__)


class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """統一エラーハンドリング"""

    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response

        except HTTPException as e:
            # FastAPI HTTPExceptionはそのまま通す
            raise e

        except SQLAlchemyError as e:
            # データベースエラー
            logger.error(f"Database error: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={
                    "detail": ERROR_MESSAGES["DATABASE"]["CONNECTION_ERROR"],
                    "error_code": "DATABASE_ERROR",
                },
            )

        except Exception as e:
            # その他の予期しないエラー
            logger.error(f"Unexpected error: {str(e)}")
            logger.error(traceback.format_exc())

            return JSONResponse(
                status_code=500,
                content={
                    "detail": "内部サーバーエラーが発生しました",
                    "error_code": "INTERNAL_SERVER_ERROR",
                },
            )


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """セキュリティヘッダー追加"""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # セキュリティヘッダーを追加
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"

        return response
