import pytest
import os
from fastapi.testclient import TestClient

# テスト環境設定
os.environ["TESTING"] = "true"
os.environ["OPENAI_API_KEY"] = "test-dummy-key"  # ダミーキー

from app.main import app


@pytest.fixture
def client():
    """テスト用のクライアントを作成"""
    return TestClient(app)


@pytest.fixture
def firebase_token():
    """テスト用のダミー Firebase トークン"""
    return "dummy_token"


# テスト用データベース設定
os.environ["DATABASE_URL"] = "sqlite:///./test.db"
