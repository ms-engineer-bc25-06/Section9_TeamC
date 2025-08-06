from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.challenge import ChallengeStatus, ChallengeCategory


class ChallengeBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: ChallengeCategory = ChallengeCategory.OTHER
    difficulty_level: int = 1
    estimated_duration: Optional[int] = None
    reward_points: int = 10
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class ChallengeCreate(ChallengeBase):
    pass


class ChallengeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[ChallengeCategory] = None
    difficulty_level: Optional[int] = None
    estimated_duration: Optional[int] = None
    reward_points: Optional[int] = None
    status: Optional[ChallengeStatus] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class Challenge(ChallengeBase):
    id: int
    status: ChallengeStatus
    creator_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ChallengeWithCreator(Challenge):
    creator: "User"

    class Config:
        from_attributes = True


class ChallengeWithParticipations(Challenge):
    participations: List["ChallengeParticipation"] = []

    class Config:
        from_attributes = True


class ChallengeParticipationBase(BaseModel):
    challenge_id: int
    child_id: int
    status: str = "not_started"
    progress_percentage: int = 0
    notes: Optional[str] = None


class ChallengeParticipationCreate(ChallengeParticipationBase):
    pass


class ChallengeParticipationUpdate(BaseModel):
    status: Optional[str] = None
    progress_percentage: Optional[int] = None
    notes: Optional[str] = None
    points_earned: Optional[int] = None


class ChallengeParticipation(ChallengeParticipationBase):
    id: int
    completed_at: Optional[datetime] = None
    points_earned: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ChallengeParticipationWithDetails(ChallengeParticipation):
    challenge: Challenge
    child: "Child"

    class Config:
        from_attributes = True


from app.schemas.user import User
from app.schemas.child import Child

ChallengeWithCreator.model_rebuild()
ChallengeWithParticipations.model_rebuild()
ChallengeParticipationWithDetails.model_rebuild()
