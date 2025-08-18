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

# backend/app/routers/children.py - クリーンアップ版

@router.get("/", response_model=List[ChildSchema])
async def get_children(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    try:
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
        
        result = db.execute(
            select(ChildModel).where(ChildModel.user_id == user.id)
        )
        children = result.scalars().all()
        
        # 手動でデータ変換（birthdate → birth_date）
        children_response = []
        for child in children:
            child_dict = {
                'id': child.id,
                'user_id': child.user_id,
                'nickname': child.nickname,
                'birth_date': child.birthdate,  # birthdate → birth_date に変換
                'created_at': child.created_at,
            }
            children_response.append(ChildSchema(**child_dict))
        
        return children_response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.post("/", response_model=ChildSchema)
async def create_child(
    child_data: ChildCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    try:
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
        
        child_dict = child_data.model_dump()
        
        # birth_date → birthdate に変換
        if 'birth_date' in child_dict:
            child_dict['birthdate'] = child_dict.pop('birth_date')
        
        child = ChildModel(**child_dict, user_id=user.id)
        db.add(child)
        db.commit()
        db.refresh(child)
        
        # レスポンス用にデータ変換（birthdate → birth_date）
        response_data = {
            'id': child.id,
            'user_id': child.user_id,
            'nickname': child.nickname,
            'birth_date': child.birthdate,  # birthdate → birth_date に変換
            'created_at': child.created_at,
        }
        return ChildSchema(**response_data)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
