from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr

from app.schemas.child import Child


class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    bio: Optional[str] = None
    profile_image: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    bio: Optional[str] = None
    profile_image: Optional[str] = None


class UserPasswordUpdate(BaseModel):
    current_password: str
    new_password: str


class User(UserBase):
    id: int
    is_active: bool
    is_superuser: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserWithChildren(User):
    children: List["Child"] = []

    class Config:
        from_attributes = True


UserWithChildren.model_rebuild()
