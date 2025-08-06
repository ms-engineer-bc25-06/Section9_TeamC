from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    DateTime,
    Text,
    Boolean,
    Enum,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum as PyEnum
from app.core.database import Base


class ChallengeStatus(PyEnum):
    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ChallengeCategory(PyEnum):
    STUDY = "study"
    EXERCISE = "exercise"
    CREATIVITY = "creativity"
    LIFE_SKILLS = "life_skills"
    SOCIAL = "social"
    OTHER = "other"


class Challenge(Base):
    __tablename__ = "challenges"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    category = Column(Enum(ChallengeCategory), default=ChallengeCategory.OTHER)
    difficulty_level = Column(Integer, default=1)  # 1-5
    estimated_duration = Column(Integer)  # minutes
    reward_points = Column(Integer, default=10)
    status = Column(Enum(ChallengeStatus), default=ChallengeStatus.DRAFT)
    start_date = Column(DateTime(timezone=True))
    end_date = Column(DateTime(timezone=True))
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    creator = relationship("User", back_populates="created_challenges")
    participations = relationship(
        "ChallengeParticipation",
        back_populates="challenge",
        cascade="all, delete-orphan",
    )


class ChallengeParticipation(Base):
    __tablename__ = "challenge_participations"

    id = Column(Integer, primary_key=True, index=True)
    challenge_id = Column(Integer, ForeignKey("challenges.id"), nullable=False)
    child_id = Column(Integer, ForeignKey("children.id"), nullable=False)
    status = Column(
        String(50), default="not_started"
    )  # not_started, in_progress, completed, failed
    progress_percentage = Column(Integer, default=0)
    notes = Column(Text)
    completed_at = Column(DateTime(timezone=True))
    points_earned = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    challenge = relationship("Challenge", back_populates="participations")
    child = relationship("Child", back_populates="challenge_participations")
