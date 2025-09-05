import uuid
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ChildBase(BaseModel):
    nickname: str = Field(..., min_length=1, max_length=50)
    birthdate: Optional[date] = Field(default=None)

    @field_validator("nickname")
    @classmethod
    def validate_nickname(cls, value):
        if not value or not value.strip():
            raise ValueError("ニックネームは必須です")
        
        # 特殊文字チェック
        if not value.replace(" ", "").replace("-", "").replace("_", "").isalnum():
            # 日本語、英数字、スペース、ハイフン、アンダースコアのみ許可
            cleaned = ''.join(c for c in value if c.isalnum() or c in [' ', '-', '_'] or '\u3041' <= c <= '\u3096' or '\u30a1' <= c <= '\u30f6' or '\u4e00' <= c <= '\u9faf')
            if len(cleaned) != len(value):
                raise ValueError("ニックネームに使用できない文字が含まれています")
        
        return value.strip()

    @field_validator("birthdate")
    @classmethod
    def validate_birthdate(cls, value):
        if value is None:
            return value
        
        today = date.today()
        
        # 未来の日付チェック
        if value > today:
            raise ValueError("生年月日は未来の日付に設定できません")
        
        # 年齢範囲チェック (0-18歳)
        age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
        if age < 0:
            raise ValueError("無効な生年月日です")
        if age > 18:
            raise ValueError("対象年齢は18歳以下です")
        
        return value


class ChildCreate(ChildBase):
    model_config = ConfigDict()


class Child(ChildBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}
