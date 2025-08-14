from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from datetime import date
from uuid import UUID  # UUID対応のため追加

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
        
        # 認証ユーザーのuser_idをUUIDに変換
        user_uuid = UUID(current_user["user_id"])
        
        # 子ども一覧を非同期で取得
        result = await db.execute(
            select(Child)
            .where(Child.user_id == user_uuid)  # UUID形式で検索
            .order_by(order_by)
            .offset(skip)
            .limit(limit)
        )
        children = result.scalars().all()
        
        # 各子どもの年齢を計算して追加
        for child in children:
            if child.birthdate:  # birth_date → birthdate に修正
                child.age = calculate_age(child.birthdate)
        
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
        # 認証ユーザーのuser_idをUUIDに変換
        user_uuid = UUID(current_user["user_id"])
        
        # 同じnicknameの子どもがいないかチェック（nameはモデルから削除済み）
        result = await db.execute(
            select(Child)
            .where(Child.user_id == user_uuid)
            .where(Child.nickname == child_data.nickname)
        )
        existing_child = result.scalar_one_or_none()
        
        if existing_child:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"「{child_data.nickname}」という呼び名の子どもは既に登録されています"
            )
        
        # 新しい子どもを作成（UUID構造に対応）
        new_child = Child(
            nickname=child_data.nickname,  # nameは削除、nicknameのみ
            birthdate=child_data.birthdate,  # birth_date → birthdate
            user_id=user_uuid  # UUID形式で保存
        )
        
        db.add(new_child)
        await db.commit()
        await db.refresh(new_child)
        
        # 年齢を計算して追加
        if new_child.birthdate:
            new_child.age = calculate_age(new_child.birthdate)
        
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
    child_id: str,  # UUID文字列として受け取り
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """特定の子ども情報を取得"""
    try:
        # UUID変換
        child_uuid = UUID(child_id)
        user_uuid = UUID(current_user["user_id"])
        
        # 指定された子どもを非同期で取得
        result = await db.execute(
            select(Child)
            .where(Child.id == child_uuid)
            .where(Child.user_id == user_uuid)  # 認証ユーザーの子どものみ
        )
        child = result.scalar_one_or_none()
        
        if not child:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="指定された子どもが見つかりません"
            )
        
        # 年齢を計算して追加
        if child.birthdate:
            child.age = calculate_age(child.birthdate)
        
        return child
        
    except HTTPException:
        raise
    except ValueError:  # UUID変換エラー
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="無効な子どもIDです"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"子ども情報の取得に失敗しました: {str(e)}"
        )

@router.put("/children/{child_id}", response_model=ChildSchema)
async def update_child(
    child_id: str,  # UUID文字列として受け取り
    child_update: ChildUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """子ども情報を更新"""
    try:
        # UUID変換
        child_uuid = UUID(child_id)
        user_uuid = UUID(current_user["user_id"])
        
        # 更新対象の子どもを取得
        result = await db.execute(
            select(Child)
            .where(Child.id == child_uuid)
            .where(Child.user_id == user_uuid)  # 認証ユーザーの子どものみ
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
        if child.birthdate:
            child.age = calculate_age(child.birthdate)
        
        return child
        
    except HTTPException:
        raise
    except ValueError:  # UUID変換エラー
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="無効な子どもIDです"
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"子ども情報の更新に失敗しました: {str(e)}"
        )

@router.delete("/children/{child_id}")
async def delete_child(
    child_id: str,  # UUID文字列として受け取り
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """子どもを削除"""
    try:
        # UUID変換
        child_uuid = UUID(child_id)
        user_uuid = UUID(current_user["user_id"])
        
        # 削除対象の子どもを取得
        result = await db.execute(
            select(Child)
            .where(Child.id == child_uuid)
            .where(Child.user_id == user_uuid)  # 認証ユーザーの子どものみ
        )
        child = result.scalar_one_or_none()
        
        if not child:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="指定された子どもが見つかりません"
            )
        
        # 子どもを削除
        await db.delete(child)
        await db.commit()
        
        return {"message": "子どもを削除しました"}
        
    except HTTPException:
        raise
    except ValueError:  # UUID変換エラー
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="無効な子どもIDです"
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"子どもの削除に失敗しました: {str(e)}"
        )