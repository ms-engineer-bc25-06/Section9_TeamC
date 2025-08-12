from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from app.models.user import User
from datetime import datetime
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_or_update_user_from_firebase(self, firebase_user_data: dict) -> User:
        """
        Firebase認証データからユーザーを作成または更新
        
        Args:
            firebase_user_data: Firebase認証で取得したユーザーデータ
        
        Returns:
            User: 作成または更新されたユーザーオブジェクト
        """
        firebase_uid = firebase_user_data.get("user_id")
        email = firebase_user_data.get("email")
        name = firebase_user_data.get("name", "")
        email_verified = firebase_user_data.get("email_verified", False)
        
        try:
            # 既存ユーザーをFirebase UIDで検索
            result = await self.db.execute(
                select(User).where(User.firebase_uid == firebase_uid)
            )
            existing_user = result.scalar_one_or_none()
            
            if existing_user:
                # 既存ユーザーの情報を更新
                logger.info(f"既存ユーザー更新: {email}")
                existing_user.email = email
                existing_user.full_name = name
                existing_user.updated_at = datetime.utcnow()
                await self.db.commit()
                await self.db.refresh(existing_user)
                return existing_user
            else:
                # 新規ユーザーを作成
                logger.info(f"新規ユーザー作成: {email}")
                
                username = self._generate_username_from_email(email)
                
                new_user = User(
                    firebase_uid=firebase_uid,
                    email=email,
                    username=username,
                    full_name=name,
                    is_active=True,
                    email_verified=email_verified,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                
                self.db.add(new_user)
                await self.db.commit()
                await self.db.refresh(new_user)
                
                logger.info(f"新規ユーザー作成完了: ID={new_user.id}, Email={email}")
                return new_user
                
        except Exception as e:
            await self.db.rollback()
            logger.error(f"ユーザー作成/更新エラー: {e}")
            raise
    
    async def get_user_by_firebase_uid(self, firebase_uid: str) -> Optional[User]:
        """
        Firebase UIDでユーザーを取得
        
        Args:
            firebase_uid: Firebase UID
        
        Returns:
            User | None: ユーザーオブジェクト（存在しない場合はNone）
        """
        try:
            result = await self.db.execute(
                select(User).where(User.firebase_uid == firebase_uid)
            )
            user = result.scalar_one_or_none()
            
            if user:
                logger.info(f"ユーザー取得成功: {user.email}")
            else:
                logger.warning(f"ユーザーが見つかりません: firebase_uid={firebase_uid}")
            
            return user
            
        except Exception as e:
            logger.error(f"ユーザー取得エラー: {e}")
            raise

    def _generate_username_from_email(self, email: str) -> str:
        """
        メールアドレスからユーザー名を生成
        
        Args:
            email: メールアドレス
        
        Returns:
            str: 生成されたユーザー名
        """
        # メールのローカル部分を取得
        local_part = email.split("@")[0]
        
        # 簡易実装（実際には非同期チェックが必要だが、今回は基本実装）
        return local_part
