from databases import Database
from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

database = Database(settings.DATABASE_URL)
metadata = MetaData()

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_database():
    return database


async def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def connect_to_db():
    await database.connect()


async def disconnect_from_db():
    await database.disconnect()
