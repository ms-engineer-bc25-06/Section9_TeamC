from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Child(Base):
    __tablename__ = "children"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    nickname = Column(String(50))
    grade = Column(String(20))
    birth_date = Column(Date)
    user_id = Column(String(255), nullable=False)  # Firebase UIDに対応
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 不要なフィールドを削除:
    # - school, profile_image, interests (要件にない)
    # - updated_at (DBスキーマにない)
    # - parent_id (user_idに変更)
    
    # リレーションシップは一旦コメントアウト（userテーブルとの整合性確認が必要）
    # parent = relationship("User", back_populates="children")
    # challenge_participations = relationship("ChallengeParticipation", back_populates="child", cascade="all, delete-orphan")