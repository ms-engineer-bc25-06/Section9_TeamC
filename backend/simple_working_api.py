# backend/simple_working_api.py
# 最新DBモデル対応 + シンプルな動作確保

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import os
from typing import List

# FastAPI設定
app = FastAPI(title="BUD Simple Working API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# データベース設定（Dockerコンテナ経由）
DATABASE_URL = "postgresql://bud_user:bud_password@localhost:5432/bud_db"

print(f"🔍 データベース接続URL: {DATABASE_URL}")

try:
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    print("✅ データベース接続設定完了")
except Exception as e:
    print(f"❌ データベース接続エラー: {e}")
    engine = None

def get_db():
    if engine is None:
        raise HTTPException(status_code=500, detail="データベース接続不可")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# シンプルなAPI エンドポイント

@app.get("/")
async def root():
    return {"message": "BUD Simple Working API", "status": "ready"}

@app.get("/health")
async def health():
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        return {"status": "healthy", "database": "connected"}
    except:
        return {"status": "unhealthy", "database": "disconnected"}

@app.get("/api/tables")
async def check_tables(db: Session = Depends(get_db)):
    """現在のデータベーステーブル構造を確認"""
    try:
        # テーブル一覧を取得
        result = db.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """))
        tables = [row[0] for row in result.fetchall()]
        
        table_info = {}
        for table in tables:
            # 各テーブルのカラム情報を取得
            column_result = db.execute(text(f"""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_name = '{table}'
                ORDER BY ordinal_position
            """))
            columns = [
                {
                    "name": row[0], 
                    "type": row[1], 
                    "nullable": row[2] == "YES"
                } 
                for row in column_result.fetchall()
            ]
            table_info[table] = columns
        
        return {
            "message": "テーブル構造確認",
            "tables": tables,
            "details": table_info
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"テーブル確認エラー: {str(e)}")

@app.get("/api/users/raw")
async def get_users_raw(db: Session = Depends(get_db)):
    """生SQLでユーザー一覧を取得（モデルに依存しない）"""
    try:
        result = db.execute(text("SELECT * FROM users LIMIT 10"))
        columns = result.keys()
        rows = result.fetchall()
        
        users = []
        for row in rows:
            user_dict = {}
            for i, column in enumerate(columns):
                user_dict[column] = row[i]
            users.append(user_dict)
        
        return {
            "message": "ユーザー一覧取得成功（生SQL）",
            "users": users,
            "count": len(users)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ユーザー取得エラー: {str(e)}")

@app.get("/api/children/raw")
async def get_children_raw(db: Session = Depends(get_db)):
    """生SQLで子ども一覧を取得（モデルに依存しない）"""
    try:
        result = db.execute(text("SELECT * FROM children LIMIT 10"))
        columns = result.keys()
        rows = result.fetchall()
        
        children = []
        for row in rows:
            child_dict = {}
            for i, column in enumerate(columns):
                # 日付などの特殊型を文字列に変換
                value = row[i]
                if hasattr(value, 'isoformat'):
                    value = value.isoformat()
                child_dict[column] = value
            children.append(child_dict)
        
        return {
            "message": "子ども一覧取得成功（生SQL）",
            "children": children,
            "count": len(children)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"子ども取得エラー: {str(e)}")

@app.get("/api/children")
async def get_children():
    """子ども一覧API（フロントエンド対応）- ダミーデータ版"""
    # データベース接続問題を回避して、まずフロントエンドとの通信を確認
    dummy_children = [
        {
            "id": "660e8400-e29b-41d4-a716-446655440001",
            "nickname": "ゆうくん",
            "age": 8,
            "created_at": "2025-08-14T09:53:23.734072+00:00",
            "updated_at": "2025-08-14T09:53:23.734072+00:00",
            "user_name": "田中太郎"
        },
        {
            "id": "660e8400-e29b-41d4-a716-446655440002", 
            "nickname": "あかりちゃん",
            "age": 6,
            "created_at": "2025-08-14T09:53:23.734072+00:00",
            "updated_at": "2025-08-14T09:53:23.734072+00:00",
            "user_name": "田中太郎"
        },
        {
            "id": "660e8400-e29b-41d4-a716-446655440003",
            "nickname": "そらちゃん", 
            "age": 10,
            "created_at": "2025-08-14T09:53:23.734072+00:00",
            "updated_at": "2025-08-14T09:53:23.734072+00:00",
            "user_name": "佐藤花子"
        }
    ]
    
    return {
        "message": "子ども一覧取得成功（ダミーデータ）",
        "children": dummy_children,
        "count": len(dummy_children)
    }

@app.post("/api/auth/login")
async def simple_login():
    """シンプルな認証API（モック）"""
    return {
        "message": "認証成功",
        "user": {
            "id": 1,
            "email": "test@example.com",
            "name": "テストユーザー"
        }
    }

# 起動時メッセージ
@app.on_event("startup")
async def startup():
    print("🚀 BUD Simple Working API 起動")
    print("📍 URL: http://localhost:8000")
    print("🔍 Tables: http://localhost:8000/api/tables")
    print("👶 Children: http://localhost:8000/api/children")
    print("✅ 最新DBモデル対応済み")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)