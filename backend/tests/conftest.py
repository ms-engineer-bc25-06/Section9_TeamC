import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    """テスト用のクライアントを作成"""
    return TestClient(app)

@pytest.fixture
def firebase_token():
    """テスト用のダミー Firebase トークン"""
    return "dummy_token"


@pytest.fixture(autouse=True)
def mock_verify_firebase_token(monkeypatch):
    async def mock(token: str):
        return {"uid": "test_uid", "email": "test@example.com", "name": "Test User"}
    monkeypatch.setattr("app.main.verify_firebase_token", mock)
