from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.child import Child as ChildModel
from app.models.user import User
from app.schemas.child import Child as ChildSchema
from app.schemas.child import ChildCreate
from app.utils.auth import get_current_user

router = APIRouter()


@router.get("/", response_model=List[ChildSchema])
async def get_children(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """認証されたユーザーの子どもリストを取得"""
    try:
        # Firebase UIDでユーザーを検索
        result = db.execute(select(User).where(User.firebase_uid == current_user["user_id"]))
        user = result.scalars().first()

        # ユーザーが存在しない場合は新規作成
        if not user:
            user = User(
                email=current_user.get("email", ""),
                name=current_user.get("name", ""),
                firebase_uid=current_user["user_id"],
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # ユーザーの子どもリストを取得
        result = db.execute(select(ChildModel).where(ChildModel.user_id == user.id))
        children = result.scalars().all()
        # Pydanticモデルに変換して返却
        return [ChildSchema.model_validate(child) for child in children]
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@router.get("/{child_id}", response_model=ChildSchema)
async def get_child(
    child_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """特定の子どもの詳細情報を取得（自分の子どものみ）"""
    try:
        # 現在のユーザーを取得
        result = db.execute(select(User).where(User.firebase_uid == current_user["user_id"]))
        user = result.scalars().first()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # 指定されたIDの子どもを取得（セキュリティ：自分の子どものみ）
        result = db.execute(
            select(ChildModel).where(
                ChildModel.id == child_id,
                ChildModel.user_id == user.id,
            )
        )
        child = result.scalars().first()

        if not child:
            raise HTTPException(status_code=404, detail="Child not found")

        # Pydanticモデルに変換して返却
        return ChildSchema.model_validate(child)

    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@router.post("/", response_model=ChildSchema)
async def create_child(
    child_data: ChildCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """新しい子どもを作成"""
    try:
        # 現在のユーザーを取得または作成
        result = db.execute(select(User).where(User.firebase_uid == current_user["user_id"]))
        user = result.scalars().first()

        if not user:
            user = User(
                email=current_user.get("email", ""),
                name=current_user.get("name", ""),
                firebase_uid=current_user["user_id"],
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # リクエストデータを辞書形式に変換
        child_dict = child_data.model_dump()

        # 子どもレコードを作成
        child = ChildModel(**child_dict, user_id=user.id)
        db.add(child)
        db.commit()
        db.refresh(child)

        # Pydanticモデルに変換して返却
        return ChildSchema.model_validate(child)
    except Exception as error:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(error))


@router.put("/{child_id}", response_model=ChildSchema)
async def update_child(
    child_id: str,
    child_data: ChildCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """子ども情報を更新"""
    try:
        # 現在のユーザーを取得
        result = db.execute(select(User).where(User.firebase_uid == current_user["user_id"]))
        user = result.scalars().first()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # 指定されたIDの子どもを取得（セキュリティ：自分の子どものみ）
        result = db.execute(
            select(ChildModel).where(
                ChildModel.id == child_id,
                ChildModel.user_id == user.id,
            )
        )
        child = result.scalars().first()

        if not child:
            raise HTTPException(status_code=404, detail="Child not found")

        # 子ども情報を更新
        child_dict = child_data.model_dump(exclude_unset=True)
        for key, value in child_dict.items():
            if value is not None:  # None以外の値のみ更新
                setattr(child, key, value)

        db.commit()
        db.refresh(child)

        return ChildSchema.model_validate(child)

    except HTTPException:
        raise
    except Exception as error:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(error))


@router.delete("/{child_id}")
async def delete_child(
    child_id: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)
):
    """子ども情報を削除する（関連データも含めて）"""
    try:
        # 現在のユーザーを取得
        result = db.execute(select(User).where(User.firebase_uid == current_user["user_id"]))
        user = result.scalars().first()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # 指定されたIDの子どもを取得（セキュリティ：自分の子どものみ）
        result = db.execute(
            select(ChildModel).where(ChildModel.id == child_id, ChildModel.user_id == user.id)
        )
        child = result.scalars().first()

        if not child:
            raise HTTPException(status_code=404, detail="指定された子ども情報が見つかりません")

        # 関連データを削除（challenges テーブル）
        db.execute(
            text("DELETE FROM challenges WHERE child_id = :child_id"), {"child_id": child_id}
        )

        # 子どもレコードを削除
        db.delete(child)
        db.commit()

        return {"message": "子ども情報を削除しました", "deleted_id": child_id}

    except HTTPException:
        raise
    except Exception as error:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"削除処理中にエラーが発生しました: {str(error)}"
        )
