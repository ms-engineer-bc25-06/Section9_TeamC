
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.user import User
from typing import Dict, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class UserService:
    def __init__(self, db: Session):
        self.db = db
    
    async def get_or_create_user_from_firebase(self, firebase_user_data: Dict[str, Any]) -> User:
        """
        Firebase認証データからユーザーを取得または作成
        
        Args:
            firebase_user_data: Firebase認証から取得したユーザー情報
            - user_id: Firebase UID
            - email: メールアドレス
            - name: 表示名
            - email_verified: メール認証済みフラグ
        
        Returns:
            User: データベースのユーザーオブジェクト
        """
        firebase_uid = firebase_user_data.get("user_id")
        email = firebase_user_data.get("email")
        name = firebase_user_data.get("name", "")
        email_verified = firebase_user_data.get("email_verified", False)
        
        try:
            # 既存ユーザーをFirebase UIDで検索
            existing_user = self.db.execute(
                select(User).where(User.firebase_uid == firebase_uid)
            ).scalar_one_or_none()
            
            if existing_user:
                # 既存ユーザーの情報を更新
                logger.info(f"既存ユーザー更新: {email}")
                existing_user.email = email
                existing_user.full_name = name
                existing_user.updated_at = datetime.utcnow()
                self.db.commit()
                self.db.refresh(existing_user)
                return existing_user
            
            else:
                # 新規ユーザー作成
                logger.info(f"新規ユーザー作成: {email}")
                new_user = User(
                    firebase_uid=firebase_uid,
                    email=email,
                    full_name=name,
                    username=self._generate_username_from_email(email),
                    is_active=True,
                    is_superuser=False
                )
                
                self.db.add(new_user)
                self.db.commit()
                self.db.refresh(new_user)
                
                logger.info(f"新規ユーザー作成完了: ID={new_user.id}, Email={email}")
                return new_user
                
        except Exception as e:
            self.db.rollback()
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
            user = self.db.execute(
                select(User).where(User.firebase_uid == firebase_uid)
            ).scalar_one_or_none()
            
            if user:
                logger.info(f"ユーザー取得成功: {user.email}")
            else:
                logger.warning(f"ユーザーが見つかりません: firebase_uid={firebase_uid}")
            
            return user
            
        except Exception as e:
            logger.error(f"ユーザー取得エラー: {e}")
            raise
    
    async def get_user_profile(self, firebase_uid: str) -> Dict[str, Any]:
        """
        ユーザープロフィール情報を取得
        
        Args:
            firebase_uid: Firebase UID
        
        Returns:
            Dict: ユーザープロフィール情報
        """
        user = await self.get_user_by_firebase_uid(firebase_uid)
        
        if not user:
            return None
        
        return {
            "id": user.id,
            "firebase_uid": user.firebase_uid,
            "email": user.email,
            "full_name": user.full_name,
            "username": user.username,
            "is_active": user.is_active,
            "profile_image": user.profile_image,
            "bio": user.bio,
            "created_at": user.created_at.isoformat(),
            "updated_at": user.updated_at.isoformat() if user.updated_at else None,
            "children_count": len(user.children),
            "challenges_created": len(user.created_challenges)
        }
    
    async def update_user_profile(
        self, 
        firebase_uid: str, 
        profile_data: Dict[str, Any]
    ) -> Optional[User]:
        """
        ユーザープロフィールを更新
        
        Args:
            firebase_uid: Firebase UID
            profile_data: 更新するプロフィールデータ
        
        Returns:
            User | None: 更新されたユーザーオブジェクト
        """
        try:
            user = await self.get_user_by_firebase_uid(firebase_uid)
            
            if not user:
                return None
            
            # 更新可能フィールドのみ更新
            updatable_fields = ["full_name", "username", "profile_image", "bio"]
            
            for field in updatable_fields:
                if field in profile_data:
                    setattr(user, field, profile_data[field])
            
            user.updated_at = datetime.utcnow()
            
            self.db.commit()
            self.db.refresh(user)
            
            logger.info(f"ユーザープロフィール更新完了: {user.email}")
            return user
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"ユーザープロフィール更新エラー: {e}")
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
        
        # 既存のユーザー名と重複しないかチェック
        base_username = local_part
        username = base_username
        counter = 1
        
        while self.db.execute(
            select(User).where(User.username == username)
        ).scalar_one_or_none():
            username = f"{base_username}_{counter}"
            counter += 1
        
        return username