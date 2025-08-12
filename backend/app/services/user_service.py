from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_or_update_user_from_firebase(self, firebase_user_data: dict) -> dict:
        """
        Firebase認証データからユーザー情報を返す（データベース操作なし）
        """
        firebase_uid = firebase_user_data.get("user_id")
        email = firebase_user_data.get("email")
        name = firebase_user_data.get("name", "")
        
        logger.info(f"Firebase認証成功: {email}")
        
        # 一時的にデータベース操作をスキップ、認証情報だけ返す
        return {
            "id": 1,  # 仮のID
            "firebase_uid": firebase_uid,
            "email": email,
            "full_name": name,
            "username": email.split("@")[0]
        }
