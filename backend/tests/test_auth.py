from fastapi import status

# --- テスト用の関数ベースでシンプルに書く ---


def test_firebase_login_success(client, firebase_token):
    """Firebase認証で正常にログインできるテスト"""
    response = client.post("/api/auth/login", json={"idToken": firebase_token})
    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert "user" in data
    assert data["user"]["email"] == "test@example.com"
    assert data["user"]["firebase_uid"] == "test_uid"


def test_firebase_login_missing_token(client):
    """idTokenがない場合に422が返るテスト"""
    response = client.post("/api/auth/login", json={})
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
