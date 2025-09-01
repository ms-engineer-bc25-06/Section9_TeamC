from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    PROJECT_NAME: str = "Section9 TeamC Backend"
    VERSION: str = "1.0.0"

    # TODO: 本番環境での適切なシークレットキー設定が必要
    # SECURITY: 本番環境では必ず環境変数から設定すること
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # TODO: 本番環境での適切なデータベース接続文字列設定が必要
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/dbname")

    ALLOWED_HOSTS: str = os.getenv("ALLOWED_HOSTS", "http://localhost:3000,http://127.0.0.1:3000")

    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")

    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"

    # NOTE: Firebase認証用設定
    # TODO: 本番環境ではserviceAccountKey.jsonの管理方法を見直し
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "bud-app-4dd93")
    GOOGLE_APPLICATION_CREDENTIALS: str = os.getenv(
        "GOOGLE_APPLICATION_CREDENTIALS", "./serviceAccountKey.json"
    )
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    @property
    def allowed_hosts_list(self) -> List[str]:
        """Convert comma-separated ALLOWED_HOSTS string to list"""
        return [host.strip() for host in self.ALLOWED_HOSTS.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
