# Firebase認証ユーティリティ

import os
from typing import Any, Dict, Optional

import firebase_admin
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin import auth, credentials

# 1. Firebase初期化（最初に1回だけ）
if not firebase_admin._apps:
    try:
        # 絶対パスで指定（最も確実）
        import os

        # Docker環境では /app/serviceAccountKey.json を使用
        docker_cred_path = "/app/serviceAccountKey.json"
        local_cred_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "serviceAccountKey.json"
        )

        if os.path.exists(docker_cred_path):
            cred_path = docker_cred_path
            print(f"🔍 Dockerパス使用: {cred_path}")
        elif os.path.exists(local_cred_path):
            cred_path = local_cred_path
            print(f"🔍 ローカルパス使用: {cred_path}")
        else:
            raise FileNotFoundError("serviceAccountKey.jsonが見つかりません")

        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        print("✅ Firebase初期化完了")
    except Exception as e:
        print(f"❌ Firebase初期化エラー: {e}")
        print("⚠️ 正しいserviceAccountKey.jsonをプロジェクトルートに配置してください")
        raise e

# 2. トークンを取得するための仕組み
security = HTTPBearer()


# 3. トークンをチェックする関数
async def get_current_user(
    token_credentials: HTTPAuthorizationCredentials = Depends(security),
) -> Dict[str, Any]:
    """
    Firebaseトークンを検証して、ユーザー情報を返す

    Args:
        token_credentials: HTTPBearerから取得したトークン

    Returns:
        Dict[str, Any]: ユーザー情報

    Raises:
        HTTPException: 認証に失敗した場合
    """
    token = token_credentials.credentials

    try:
        # Firebase Admin SDKでトークン検証
        decoded_token = auth.verify_id_token(token)

        # 検証成功！ユーザー情報を返す
        user_info = {
            "user_id": decoded_token["uid"],
            "email": decoded_token.get("email", ""),
            "name": decoded_token.get("name", ""),
            "email_verified": decoded_token.get("email_verified", False),
        }

        print(f"✅ 認証成功: {user_info['email']}")
        return user_info

    except Exception as error:
        print(f"❌ 認証に失敗しました: {error}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="認証に失敗しました",
            headers={"WWW-Authenticate": "Bearer"},
        )


# 4. オプショナルな認証（ログインしていなくてもOK）
async def get_current_user_optional(
    token_credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer(auto_error=False)),
) -> Optional[Dict[str, Any]]:
    """
    オプショナルな認証（トークンがない場合はNoneを返す）

    Returns:
        Dict[str, Any] | None: ユーザー情報またはNone
    """
    if not token_credentials:
        return None

    try:
        return await get_current_user(token_credentials)
    except HTTPException:
        return None


# 5. トークンのみを検証する関数（main.py用）
async def verify_firebase_token(token: str) -> Dict[str, Any]:
    """
    Firebaseトークンを検証してデコード済みトークンを返す

    Args:
        token: Firebase IDトークン

    Returns:
        Dict[str, Any]: デコード済みトークン情報

    Raises:
        Exception: 認証に失敗した場合
    """
    try:
        # Firebase Admin SDKでトークン検証
        decoded_token = auth.verify_id_token(token)
        return decoded_token

    except Exception as error:
        print(f"❌ トークン検証エラー: {str(error)}")
        raise error
