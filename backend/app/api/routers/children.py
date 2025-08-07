from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.child import Child
from app.models.user import User
from app.schemas.child import Child as ChildSchema, ChildCreate, ChildUpdate, ChildWithParent
from app.api.routers.auth import get_current_active_user

router = APIRouter()

@router.get("/", response_model=List[ChildSchema])
async def get_children(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    children = db.query(Child).filter(Child.parent_id == current_user.id).all()
    return children

@router.post("/", response_model=ChildSchema)
async def create_child(
    child: ChildCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_child = Child(**child.dict(), parent_id=current_user.id)
    db.add(db_child)
    db.commit()
    db.refresh(db_child)
    return db_child

@router.get("/{child_id}", response_model=ChildWithParent)
async def get_child(
    child_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    child = db.query(Child).filter(
        Child.id == child_id,
        Child.parent_id == current_user.id
    ).first()

    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found"
        )

    return child

@router.put("/{child_id}", response_model=ChildSchema)
async def update_child(
    child_id: int,
    child_update: ChildUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    child = db.query(Child).filter(
        Child.id == child_id,
        Child.parent_id == current_user.id
    ).first()

    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found"
        )

    update_data = child_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(child, field, value)

    db.commit()
    db.refresh(child)
    return child

@router.delete("/{child_id}")
async def delete_child(
    child_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    child = db.query(Child).filter(
        Child.id == child_id,
        Child.parent_id == current_user.id
    ).first()

    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found"
        )

    db.delete(child)
    db.commit()
    return {"message": "Child deleted successfully"}
