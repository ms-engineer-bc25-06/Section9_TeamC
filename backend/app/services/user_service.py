from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.user import User


class UserService:
    def __init__(self, db: Session):
        self.db = db

    async def get_or_create_user_from_firebase(
        self, firebase_uid: str, email: str, name: str
    ) -> User:
        print(f"🔍 ユーザー検索開始: {email}, Firebase UID: {firebase_uid}")

        try:
            # 既存ユーザーを検索
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

            print(f"✅ ユーザー作成完了: ID={user.id}")
            return user

        except Exception as e:
            print(f"❌ get_or_create_user エラー: {e}")
            self.db.rollback()
            raise
