from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime, date
import uuid


class ChildBase(BaseModel):
    nickname: str
    birth_date: Optional[date] = None

    @field_validator("nickname")
    @classmethod
    def nickname_must_not_be_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("ニックネームは必須です")
        return v.strip()


class ChildCreate(ChildBase):
    pass


class Child(ChildBase):  # ChildBaseを継承するので birth_date も含まれる
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}
