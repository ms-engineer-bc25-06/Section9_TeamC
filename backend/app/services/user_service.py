"""ユーザー管理サービス - Firebase UID検索の重複を解消"""

from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User


class UserService:
    def __init__(self, db: Session):
        self.db = db

    async def get_or_create_user_from_firebase(
        self, firebase_uid: str, email: str, name: str
    ) -> User:
        try:
            result = self.db.execute(select(User).where(User.firebase_uid == firebase_uid))
            user = result.scalars().first()

            if user:
                print(f"✅ 既存ユーザー発見: {user.email}")
                return user

            # 新規ユーザー作成
            print(f"🆕 新規ユーザー作成: {email}")
            user = User(firebase_uid=firebase_uid, email=email, name=name)

            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)

            return user

        except Exception:
            self.db.rollback()
            raise

    def get_user_by_firebase_uid(self, firebase_uid: str) -> Optional[User]:
        result = self.db.execute(select(User).where(User.firebase_uid == firebase_uid))
        return result.scalars().first()

    def validate_user_access(self, firebase_uid: str, child_id: str) -> bool:
        from app.models.child import Child

        result = self.db.execute(
            select(Child).where(
                Child.id == child_id,
                Child.user_id == select(User.id).where(User.firebase_uid == firebase_uid),
            )
        )
        return result.scalars().first() is not None
