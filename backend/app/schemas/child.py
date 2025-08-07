from app.schemas.user import User
from app.schemas.challenge import ChallengeParticipation
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date

class ChildBase(BaseModel):
    name: str
    birth_date: Optional[date] = None
    grade: Optional[str] = None
    school: Optional[str] = None
    interests: Optional[str] = None
    profile_image: Optional[str] = None

class ChildCreate(ChildBase):
    pass

class ChildUpdate(BaseModel):
    name: Optional[str] = None
    birth_date: Optional[date] = None
    grade: Optional[str] = None
    school: Optional[str] = None
    interests: Optional[str] = None
    profile_image: Optional[str] = None

class Child(ChildBase):
    id: int
    parent_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ChildWithParent(Child):
    parent: "User"

    class Config:
        from_attributes = True

class ChildWithChallenges(Child):
    challenge_participations: List["ChallengeParticipation"] = []

    class Config:
        from_attributes = True


ChildWithParent.model_rebuild()
ChildWithChallenges.model_rebuild()
