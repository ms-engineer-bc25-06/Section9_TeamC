from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime, date

class ChildBase(BaseModel):
    name: str
    nickname: Optional[str] = None
    grade: Optional[str] = None
    birth_date: Optional[date] = None

    @validator('name')
    def name_must_not_be_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('名前は必須です')
        return v.strip()

class ChildCreate(ChildBase):
    pass

class ChildUpdate(BaseModel):
    name: Optional[str] = None
    nickname: Optional[str] = None
    grade: Optional[str] = None
    birth_date: Optional[date] = None

    @validator('name')
    def name_must_not_be_empty(cls, v):
        if v is not None and (not v or not v.strip()):
            raise ValueError('名前は空にできません')
        return v.strip() if v else v

class Child(ChildBase):
    id: int
    user_id: str  # parent_id → user_id に修正
    created_at: datetime
    age: Optional[int] = None  # 年齢計算用

    class Config:
        from_attributes = True

    @property
    def calculated_age(self) -> Optional[int]:
        """誕生日から年齢を自動計算"""
        if self.birth_date:
            from datetime import date
            today = date.today()
            age = today.year - self.birth_date.year
            if today.month < self.birth_date.month or \
               (today.month == self.birth_date.month and today.day < self.birth_date.day):
                age -= 1
            return age
        return None