# Firebase認証ユーティリティ
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any
import os

# テスト環境チェック
IS_TESTING = os.getenv("TESTING", "false").lower() == "true"

# Firebase初期化（テスト環境では完全スキップ）
if not IS_TESTING:
    import firebase_admin
    from firebase_admin import credentials

    if not firebase_admin._apps:
        current_file = os.path.abspath(__file__)
        project_root = os.path.dirname(
            os.path.dirname(os.path.dirname(os.path.dirname(current_file)))
        )
        cred_path = os.path.join(project_root, "app", "serviceAccountKey.json")
        print(f"🔍 Firebase認証ファイルパス: {cred_path}")
        print(f"🔍 ファイル存在確認: {os.path.exists(cred_path)}")
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)

# セキュリティスキーム
security = HTTPBearer()


async def verify_firebase_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> Dict[str, Any]:
    """Firebase IDトークンを検証し、ユーザー情報を返す"""
    # テスト環境: ダミーユーザー返却
    if IS_TESTING:
        return {"uid": "test_uid", "email": "test@example.com", "name": "Test User"}

    # 本番環境: 実際のFirebase認証
    try:
        from firebase_admin import auth

        decoded_token = auth.verify_id_token(credentials.credentials)
        return {
            "uid": decoded_token["uid"],
            "email": decoded_token.get("email"),
            "name": decoded_token.get("name"),
        }
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    token_data: Dict[str, Any] = Depends(verify_firebase_token),
) -> Dict[str, Any]:
    """現在のユーザー情報を取得"""
    return token_data
