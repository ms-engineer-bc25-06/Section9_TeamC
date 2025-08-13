from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from datetime import date

from app.core.database import get_db
from app.utils.auth import get_current_user
from app.models.child import Child
from app.schemas.child import Child as ChildSchema, ChildCreate, ChildUpdate

router = APIRouter()

def calculate_age(birth_date: date) -> int:
    """生年月日から年齢を計算"""
    today = date.today()
    return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))

@router.get("/children", response_model=List[ChildSchema])
async def get_children(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0, description="スキップする件数"),
    limit: int = Query(100, ge=1, le=100, description="取得する件数"),
    sort_by: str = Query("created_at", description="ソート基準"),
    order: str = Query("desc", description="ソート順序")
):
    """認証済みユーザーの子ども一覧を取得"""
    try:
        # ソート順序の設定
        order_by = None
        if hasattr(Child, sort_by):
            column = getattr(Child, sort_by)
            order_by = column.desc() if order == "desc" else column.asc()
        else:
            order_by = Child.created_at.desc()
        
        # 子ども一覧を取得
        result = await db.execute(
            select(Child)
            .where(Child.user_id == current_user["user_id"])
            .order_by(order_by)
            .offset(skip)
            .limit(limit)
        )
        children = result.scalars().all()
        
        # 年齢を計算して追加
        for child in children:
            if child.birth_date:
                child.age = calculate_age(child.birth_date)
        
        return children
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"子ども一覧の取得に失敗しました: {str(e)}"
        )

@router.post("/children", response_model=ChildSchema, status_code=status.HTTP_201_CREATED)
async def create_child(
    child_data: ChildCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """新しい子どもを登録"""
    try:
        # 同名の子どもがいないかチェック
        result = await db.execute(
            select(Child)
            .where(Child.user_id == current_user["user_id"])
            .where(Child.name == child_data.name)
        )
        existing_child = result.scalar_one_or_none()
        
        if existing_child:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"「{child_data.name}」という名前の子どもは既に登録されています"
            )
        
        # 新しい子どもを作成
        new_child = Child(
            name=child_data.name,
            nickname=child_data.nickname,
            grade=child_data.grade,
            birth_date=child_data.birth_date,
            user_id=current_user["user_id"]
        )
        
        db.add(new_child)
        await db.commit()
        await db.refresh(new_child)
        
        # 年齢を計算して追加
        if new_child.birth_date:
            new_child.age = calculate_age(new_child.birth_date)
        
        return new_child
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"子どもの登録に失敗しました: {str(e)}"
        )

@router.get("/children/{child_id}", response_model=ChildSchema)
async def get_child(
    child_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """特定の子ども情報を取得"""
    try:
        result = await db.execute(
            select(Child)
            .where(Child.id == child_id)
            .where(Child.user_id == current_user["user_id"])
        )
        child = result.scalar_one_or_none()
        
        if not child:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="指定された子どもが見つかりません"
            )
        
        # 年齢を計算して追加
        if child.birth_date:
            child.age = calculate_age(child.birth_date)
        
        return child
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"子ども情報の取得に失敗しました: {str(e)}"
        )

@router.put("/children/{child_id}", response_model=ChildSchema)
async def update_child(
    child_id: int,
    child_update: ChildUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """子ども情報を更新"""
    try:
        result = await db.execute(
            select(Child)
            .where(Child.id == child_id)
            .where(Child.user_id == current_user["user_id"])
        )
        child = result.scalar_one_or_none()
        
        if not child:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="指定された子どもが見つかりません"
            )
        
        # 更新データを適用
        update_data = child_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(child, field, value)
        
        await db.commit()
        await db.refresh(child)
        
        # 年齢を計算して追加
        if child.birth_date:
            child.age = calculate_age(child.birth_date)
        
        return child
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"子ども情報の更新に失敗しました: {str(e)}"
        )

@router.delete("/children/{child_id}")
async def delete_child(
    child_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """子どもを削除"""
    try:
        result = await db.execute(
            select(Child)
            .where(Child.id == child_id)
            .where(Child.user_id == current_user["user_id"])
        )
        child = result.scalar_one_or_none()
        
        if not child:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="指定された子どもが見つかりません"
            )
        
        await db.delete(child)
        await db.commit()
        
        return {"message": "子どもを削除しました"}
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"子どもの削除に失敗しました: {str(e)}"
        )