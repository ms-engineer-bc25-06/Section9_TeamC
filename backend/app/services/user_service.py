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

    async def get_user_by_firebase_uid(self, firebase_uid: str) -> Optional[dict]:
        """
        Firebase UIDからユーザー情報を取得
        """
        try:
            logger.info(f"Firebase UIDでユーザー検索: {firebase_uid}")
            
            # 一時的にモックユーザー情報を返す
            mock_user = {
                "id": 1,
                "firebase_uid": firebase_uid,
                "email": "sasaryo0929@gmail.com",
                "full_name": "ryoko sasagawa",
                "username": "sasaryo0929"
            }
            
            logger.info(f"ユーザー情報取得成功: {mock_user['email']}")
            return mock_user
            
        except Exception as e:
            logger.error(f"ユーザー取得エラー: {str(e)}")
            return None

    async def get_user_children(self, user_id: int) -> list:
        """
        ユーザーの子ども一覧を取得
        """
        try:
            logger.info(f"ユーザー{user_id}の子ども一覧取得開始")
            
            # モックデータを返す
            mock_children = [
                {
                    "id": 1,
                    "user_id": user_id,
                    "name": "ひなた",
                    "nickname": "ひなたちゃん",
                    "age": 6,
                    "grade": "小学1年生",
                    "birthdate": "2018-04-15",
                    "created_at": "2024-08-01T10:00:00Z",
                    "updated_at": "2024-08-01T10:00:00Z"
                },
                {
                    "id": 2,
                    "user_id": user_id,
                    "name": "さくら",
                    "nickname": "さくらちゃん",
                    "age": 8,
                    "grade": "小学3年生",
                    "birthdate": "2016-03-22",
                    "created_at": "2024-08-01T10:00:00Z",
                    "updated_at": "2024-08-01T10:00:00Z"
                }
            ]
            
            logger.info(f"子ども一覧取得成功: {len(mock_children)}件")
            return mock_children
            
        except Exception as e:
            logger.error(f"子ども一覧取得エラー: {str(e)}")
            return []
