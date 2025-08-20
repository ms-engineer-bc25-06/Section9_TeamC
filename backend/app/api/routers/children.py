from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, text
from typing import List
from app.core.database import get_db
from app.models.child import Child as ChildModel
from app.schemas.child import ChildCreate, Child as ChildSchema
from app.utils.auth import get_current_user
from app.models.user import User

router = APIRouter()

# backend/app/routers/children.py - 子どもリスト取得API
@router.get("/", response_model=List[ChildSchema])
async def get_children(
    db: Session = Depends(get_db),  # データベース接続
    current_user: dict = Depends(get_current_user)  # 認証されたユーザー情報
):
    """認証されたユーザーの子どもリストを取得"""
    try:
        # 1. Firebase UIDでユーザーを検索
        result = db.execute(
            select(User).where(User.firebase_uid == current_user["user_id"])
        )
        user = result.scalars().first()
        
        # 2. ユーザーが存在しない場合は新規作成
        if not user:
            user = User(
                email=current_user.get("email", ""),
                name=current_user.get("name", ""),
                firebase_uid=current_user["user_id"]
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # 3. そのユーザーの子どもリストを取得
        result = db.execute(
            select(ChildModel).where(ChildModel.user_id == user.id)
        )
        children = result.scalars().all()
        
        # 4. データベースのフィールド名をAPIレスポンス用に変換
        children_response = []
        for child in children:
            child_dict = {
                'id': child.id,
                'user_id': child.user_id,
                'nickname': child.nickname,
                'birth_date': child.birthdate,  # DB: birthdate → API: birth_date
                'created_at': child.created_at,
            }
            children_response.append(ChildSchema(**child_dict))
        
        return children_response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 特定の子ども情報取得API（新規追加）
@router.get("/{child_id}", response_model=ChildSchema)
async def get_child(
    child_id: str,  # URLパラメータから子どもIDを取得
    db: Session = Depends(get_db),  # データベース接続
    current_user: dict = Depends(get_current_user)  # 認証されたユーザー情報
):
    """特定の子どもの詳細情報を取得（自分の子どものみ）"""
    try:
        # 1. 現在のユーザーを取得
        result = db.execute(
            select(User).where(User.firebase_uid == current_user["user_id"])
        )
        user = result.scalars().first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # 2. 指定されたIDの子どもを取得（セキュリティ：自分の子どものみ）
        result = db.execute(
            select(ChildModel).where(
                ChildModel.id == child_id,        # 指定されたID
                ChildModel.user_id == user.id     # 自分の子どものみ
            )
        )
        child = result.scalars().first()
        
        # 3. 子どもが見つからない場合は404エラー
        if not child:
            raise HTTPException(status_code=404, detail="Child not found")
        
        # 4. データベースのフィールド名をAPIレスポンス用に変換
        response_data = {
            'id': child.id,
            'user_id': child.user_id,
            'nickname': child.nickname,
            'birth_date': child.birthdate,  # DB: birthdate → API: birth_date
            'created_at': child.created_at,
        }
        return ChildSchema(**response_data)
    except HTTPException:
        # HTTPExceptionはそのまま再発生（404など）
        raise
    except Exception as e:
        # その他のエラーは500エラーとして処理
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=ChildSchema)
async def create_child(
    child_data: ChildCreate,  # リクエストボディから子どもデータを取得
    db: Session = Depends(get_db),  # データベース接続
    current_user: dict = Depends(get_current_user)  # 認証されたユーザー情報
):
    """新しい子どもを作成"""
    try:
        # 1. 現在のユーザーを取得または作成
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
        
        # 2. リクエストデータをデータベース用に変換
        child_dict = child_data.model_dump()
        
        # API: birth_date → DB: birthdate に変換
        if 'birth_date' in child_dict:
            child_dict['birthdate'] = child_dict.pop('birth_date')
        
        # 3. 子どもレコードを作成
        child = ChildModel(**child_dict, user_id=user.id)
        db.add(child)
        db.commit()
        db.refresh(child)  # 作成されたレコードの最新情報を取得
        
        # 4. レスポンス用にデータ変換
        response_data = {
            'id': child.id,
            'user_id': child.user_id,
            'name': child.nickname,
            'birth_date': child.birthdate,  # DB: birthdate → API: birth_date
            'created_at': child.created_at,
        }
        return ChildSchema(**response_data)
    except Exception as e:
        db.rollback()  # エラー時はトランザクションをロールバック
        raise HTTPException(status_code=500, detail=str(e))
    
@router.delete("/{child_id}")
async def delete_child(
    child_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    子ども情報を削除する（関連データも含めて）
    """
    try:
        # 1. 現在のユーザーを取得
        result = db.execute(
            select(User).where(User.firebase_uid == current_user["user_id"])
        )
        user = result.scalars().first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # 2. 指定されたIDの子どもを取得（セキュリティ：自分の子どものみ）
        result = db.execute(
            select(ChildModel).where(
                ChildModel.id == child_id,
                ChildModel.user_id == user.id
            )
        )
        child = result.scalars().first()
        
        # 3. 子どもが見つからない場合は404エラー
        if not child:
            raise HTTPException(
                status_code=404,
                detail="指定された子ども情報が見つかりません"
            )
        
        # 4. 関連データを削除（challenges テーブルのみ）
        db.execute(
            text("DELETE FROM challenges WHERE child_id = :child_id"),
            {"child_id": child_id}
        )
        
        # 5. 子どもを削除
        db.delete(child)
        db.commit()
        
        return {"message": "子ども情報を削除しました", "deleted_id": child_id}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"削除処理中にエラーが発生しました: {str(e)}"
        )