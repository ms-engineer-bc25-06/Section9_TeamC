from sqlalchemy import Column, Integer, Text, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.core.database import Base

class Challenge(Base):
    """音声チャレンジ記録モデル"""
    __tablename__ = "challenges"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    child_id = Column(UUID(as_uuid=True), ForeignKey("children.id"), nullable=False)
    transcript = Column(Text, nullable=True, comment="音声の文字起こし結果")
    comment = Column(Text, nullable=True, comment="AIフィードバック")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 双方向リレーション
    child = relationship("Child", back_populates="challenges")
    
    def __repr__(self):
        return f"<Challenge(id={self.id}, child_id={self.child_id}, date={self.created_at.date() if self.created_at else None})>"