from pydantic import BaseModel, field_validator, Field
from pydantic import ConfigDict
from typing import Optional
from datetime import datetime, date
import uuid


class ChildBase(BaseModel):
    nickname: str
    birthdate: Optional[date] = Field(default=None)

    @field_validator("nickname")
    @classmethod
    def nickname_must_not_be_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("ニックネームは必須です")
        return v.strip()


class ChildCreate(ChildBase):
    model_config = ConfigDict()


class Child(ChildBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}