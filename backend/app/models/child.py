from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Child(Base):
    __tablename__ = "children"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    birth_date = Column(Date)
    grade = Column(String(20))
    school = Column(String(100))
    profile_image = Column(String(255))
    interests = Column(Text)
    parent_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    parent = relationship("User", back_populates="children")
    challenge_participations = relationship("ChallengeParticipation", back_populates="child", cascade="all, delete-orphan")