from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List
from app.core.database import get_db
from app.models.child import Child as ChildModel
from app.schemas.child import ChildCreate, Child as ChildSchema
from app.utils.auth import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[ChildSchema])
async def get_children(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    try:
        # Get or create user from Firebase auth
        result = db.execute(
            select(User).where(User.firebase_uid == current_user["user_id"])
        )
        user = result.scalars().first()
        
        if not user:
            user = User(
                email=current_user.get("email", ""),
                name=current_user.get("name", ""),
                firebase_uid=current_user["user_id"]
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # Get children
        result = db.execute(
            select(ChildModel).where(ChildModel.user_id == user.id)
        )
        children = result.scalars().all()
        return children
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=ChildSchema)
async def create_child(
    child_data: ChildCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    try:
        # Get or create user from Firebase auth
        result = db.execute(
            select(User).where(User.firebase_uid == current_user["user_id"])
        )
        user = result.scalars().first()
        
        if not user:
            user = User(
                email=current_user.get("email", ""),
                name=current_user.get("name", ""),
                firebase_uid=current_user["user_id"]
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # Create child
        child = ChildModel(**child_data.dict(), user_id=user.id)
        db.add(child)
        db.commit()
        db.refresh(child)
        return child
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
