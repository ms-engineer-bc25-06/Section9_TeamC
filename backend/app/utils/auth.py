# Firebase認証ユーティリティ

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any, Optional
import firebase_admin
from firebase_admin import auth, credentials
import os
from dotenv import load_dotenv  # ← 追加

import firebase_admin
from firebase_admin import auth, credentials

# 1. Firebase初期化（最初に1回だけ）
if not firebase_admin._apps:
    # .env を読み込む（コンテナ内/ローカルどちらでも先に読む）
    load_dotenv()  # ← 追加

    # 絶対パスで指定（最も確実）
    import os
    
    # プロジェクトルートのパスを取得
    current_file = os.path.abspath(__file__)  # auth.pyの絶対パス
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(current_file))))
    cred_path = os.path.join(project_root, "serviceAccountKey.json")
    
    # .env（環境変数）からパスが来ていれば優先して使う
    env_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if env_path:
        # 相対パスで指定された場合はプロジェクトルートからの絶対パスに変換
        if not os.path.isabs(env_path):
            env_path = os.path.abspath(os.path.join(project_root, env_path))
        # 存在する場合のみ上書き採用（存在しなければ既定パスを継続）
        if os.path.exists(env_path):
            cred_path = env_path
        else:
            print(f"⚠️ 環境変数 GOOGLE_APPLICATION_CREDENTIALS のパスが見つかりませんでした: {env_path}。既定パスを使用します。")

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
    """
    if not token_credentials:
        return None
        
    try:
        return await get_current_user(token_credentials)
    except HTTPException:
        return None
