from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from typing import AsyncGenerator

# 環境変数から直接DATABASE_URLを取得
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/bud")

# psycopg2が含まれている場合は除去してからasyncpgに変換
if "+psycopg2" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("+psycopg2", "")
    print(f"🔧 psycopg2除去後: {DATABASE_URL}")

# asyncpg用のURLに変換
ASYNC_DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

# 非同期エンジンの作成
async_engine = create_async_engine(
    ASYNC_DATABASE_URL,
    pool_size=20,
    max_overflow=30,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=False,
)

# 同期エンジン（Alembicで使用）
sync_engine = create_engine(DATABASE_URL)

# 同期セッション（transcription.pyで使用）
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=sync_engine)

# 非同期セッションメーカー（修正版）
AsyncSessionLocal = async_sessionmaker(async_engine, class_=AsyncSession, expire_on_commit=False)

# Base class for models
Base = declarative_base()


# 同期用の依存性注入関数
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# 非同期用の依存性注入関数
async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# データベース接続テスト関数
async def test_connection() -> bool:
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        print("✅ データベース接続成功")
        return True
    except Exception as e:
        print(f"❌ データベース接続失敗: {e}")
        return False


# 後方互換性のための関数
async def connect_to_db() -> bool:
    """データベース接続初期化"""
    return await test_connection()


async def disconnect_from_db() -> None:
    """データベース接続終了"""
    await async_engine.dispose()


# database属性をhealth.pyのために追加
database = {"async_engine": async_engine, "sync_engine": sync_engine}
