from pydantic import BaseModel, field_validator, Field
from pydantic import ConfigDict
from typing import Optional
from datetime import datetime, date
import uuid


class ChildBase(BaseModel):
    nickname: str
    birthdate: Optional[date] = Field(default=None, alias="birth_date")  # DB準拠に変更＋alias追加

    @field_validator("nickname")
    @classmethod
    def nickname_must_not_be_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("ニックネームは必須です")
        return v.strip()


class ChildCreate(ChildBase):
    model_config = ConfigDict(populate_by_name=True)  # alias対応を有効化


class Child(ChildBase):  # ChildBaseを継承するので birth_date も含まれる
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True, "populate_by_name": True}  # populate_by_nameを追記
