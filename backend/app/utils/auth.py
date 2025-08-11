# Firebase認証ユーティリティ

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any, Optional
import firebase_admin
from firebase_admin import auth, credentials
import os

import firebase_admin
from firebase_admin import auth, credentials

# 1. Firebase初期化（最初に1回だけ）
if not firebase_admin._apps:
    # 絶対パスで指定（最も確実）
    import os
    
    # プロジェクトルートのパスを取得
    current_file = os.path.abspath(__file__)  # auth.pyの絶対パス
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(current_file))))
    cred_path = os.path.join(project_root, "/app/serviceAccountKey.json")
    
    print(f"🔍 Firebase認証ファイルパス: {cred_path}")
    print(f"🔍 ファイル存在確認: {os.path.exists(cred_path)}")
    
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)

# 2. トークンを取得するための仕組み
security = HTTPBearer()

# 3. トークンをチェックする関数
async def get_current_user(token_credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
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
            "email_verified": decoded_token.get("email_verified", False)
        }
        
        print(f"✅ 認証成功: {user_info['email']}")  # デバッグ用
        return user_info
        
    except Exception as e:
        print(f"❌ 認証エラー: {str(e)}")  # デバッグ用
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"認証に失敗しました: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"}
        )

# 4. オプショナルな認証（ログインしていなくてもOK）
async def get_current_user_optional(
    token_credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer(auto_error=False))
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