from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app.core.database import get_db
from app.models.child import Child
from app.models.user import User
from app.schemas.child import Child as ChildSchema, ChildCreate, ChildUpdate
from app.api.routers.auth import get_current_active_user

router = APIRouter()

@router.get("/", response_model=List[ChildSchema])
async def get_children(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1, description="ページ番号"),
    limit: int = Query(10, ge=1, le=100, description="1ページあたりの件数"),
    sort: Optional[str] = Query("created_at_desc", description="ソート順")
):
    """子ども一覧取得（ページネーション・ソート対応）"""
    
    # ソート設定
    sort_options = {
        "created_at_desc": Child.created_at.desc(),
        "created_at_asc": Child.created_at.asc(),
        "name_asc": Child.name.asc(),
        "name_desc": Child.name.desc(),
    }
    
    order_by = sort_options.get(sort, Child.created_at.desc())
    
    # ページネーション計算
    offset = (page - 1) * limit
    
    # クエリ実行 - user_id を使用
    children = db.query(Child)\
        .filter(Child.user_id == current_user.firebase_uid)\
        .order_by(order_by)\
        .offset(offset)\
        .limit(limit)\
        .all()
    
    # 年齢計算を追加
    for child in children:
        if child.birth_date:
            today = date.today()
            age = today.year - child.birth_date.year
            if today.month < child.birth_date.month or \
               (today.month == child.birth_date.month and today.day < child.birth_date.day):
                age -= 1
            child.age = age
    
    return children

@router.post("/", response_model=ChildSchema)
async def create_child(
    child: ChildCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """子ども登録"""
    
    # 重複チェック（同じユーザーの同じ名前）
    existing_child = db.query(Child).filter(
        Child.user_id == current_user.firebase_uid,
        Child.name == child.name.strip()
    ).first()
    
    if existing_child:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="同じ名前の子どもが既に登録されています"
        )
    
    # 新規作成 - user_id を使用
    db_child = Child(
        **child.dict(),
        user_id=current_user.firebase_uid  # parent_id → user_id に修正
    )
    
    db.add(db_child)
    db.commit()
    db.refresh(db_child)
    
    # 年齢計算
    if db_child.birth_date:
        today = date.today()
        age = today.year - db_child.birth_date.year
        if today.month < db_child.birth_date.month or \
           (today.month == db_child.birth_date.month and today.day < db_child.birth_date.day):
            age -= 1
        db_child.age = age
    
    return db_child

@router.get("/{child_id}", response_model=ChildSchema)
async def get_child(
    child_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """子ども詳細取得"""
    child = db.query(Child).filter(
        Child.id == child_id,
        Child.user_id == current_user.firebase_uid  # parent_id → user_id に修正
    ).first()

    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="子どもが見つかりません"
        )

    # 年齢計算
    if child.birth_date:
        today = date.today()
        age = today.year - child.birth_date.year
        if today.month < child.birth_date.month or \
           (today.month == child.birth_date.month and today.day < child.birth_date.day):
            age -= 1
        child.age = age

    return child

@router.put("/{child_id}", response_model=ChildSchema)
async def update_child(
    child_id: int,
    child_update: ChildUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """子ども情報更新"""
    child = db.query(Child).filter(
        Child.id == child_id,
        Child.user_id == current_user.firebase_uid  # parent_id → user_id に修正
    ).first()

    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="子どもが見つかりません"
        )

    update_data = child_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(child, field, value)

    db.commit()
    db.refresh(child)
    
    # 年齢計算
    if child.birth_date:
        today = date.today()
        age = today.year - child.birth_date.year
        if today.month < child.birth_date.month or \
           (today.month == child.birth_date.month and today.day < child.birth_date.day):
            age -= 1
        child.age = age

    return child

@router.delete("/{child_id}")
async def delete_child(
    child_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """子ども削除"""
    child = db.query(Child).filter(
        Child.id == child_id,
        Child.user_id == current_user.firebase_uid  # parent_id → user_id に修正
    ).first()

    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="子どもが見つかりません"
        )

    db.delete(child)
    db.commit()
    return {"message": "子どもを削除しました"}