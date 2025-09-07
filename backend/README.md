# 🔧 BUD Backend

> FastAPI + Python による小学生向け英会話アプリのバックエンド

## 🚀 開発開始

### Docker 環境での開発（推奨）

```bash
# バックエンド開発環境に入る
docker-compose exec backend bash

# 開発サーバー確認（Docker 内で自動起動済み）
# http://localhost:8000/docs で Swagger UI 確認可能
```

### ローカル環境での開発（参考）

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

---

## 🧪 テスト実行

### Unit Test（pytest）

```bash
# Docker 環境でテスト実行
docker-compose exec backend bash
pytest

# カバレッジ付きテスト
pytest --cov=app --cov-report=term-missing
```

### API テスト

```bash
# Docker 環境で API テスト
docker-compose exec backend bash
pytest tests/test_api.py

# ヘルスチェック確認
curl http://localhost:8000/health
```

---

## 🛠 技術スタック

### コア技術

- Framework: FastAPI
- Language: Python 3.11
- Database: PostgreSQL + SQLAlchemy
- Migration: Alembic
- Auth: Firebase Admin SDK

### 外部サービス

- AI: OpenAI API (GPT-4 による学習フィードバック)
- Auth: Firebase Authentication
- Database: PostgreSQL (Docker)
- 音声処理: Web Speech API (フロントエンド)

---

## 📁 ディレクトリ構成

```text
backend/
├── app/
│   ├── main.py              # FastAPI アプリケーション
│   ├── api/routers/         # API ルーター
│   ├── core/                # コア設定
│   ├── models/              # データモデル
│   ├── schemas/             # API 仕様
│   ├── services/            # ビジネスロジック
│   └── utils/               # ユーティリティ
├── alembic/                 # DB マイグレーション
├── tests/                   # テストファイル
└── requirements.txt         # Python 依存関係
```

---

## 🔧 開発ガイド

### Docker 環境での開発フロー

```bash
# 1. Docker 環境起動
docker-compose up -d

# 2. バックエンドコンテナに入る
docker-compose exec backend bash

# 3. 開発作業（ファイル編集はローカル、実行は Docker 内）
```

### データベース操作

```bash
# Docker 環境でマイグレーション
docker-compose exec backend bash

# マイグレーション作成
alembic revision --autogenerate -m "Add new table"

# マイグレーション実行
alembic upgrade head
```

---

## 🐛 トラブルシューティング

### Docker 関連のエラー

#### 1. コンテナに入れない

```bash
# コンテナ状態確認
docker-compose ps

# コンテナ再起動
docker-compose restart backend
```

#### 2. データベース接続エラー

```bash
# データベースコンテナ確認
docker-compose exec db psql -U postgres -d bud_db

# データベース再起動
docker-compose restart db
```

### Firebase 関連エラー

#### 1. Firebase 認証エラー

```bash
# serviceAccountKey.json 確認
ls -la serviceAccountKey.json

# ファイル権限確認
chmod 644 serviceAccountKey.json
```

### マイグレーション関連エラー

#### 1. マイグレーションエラー

```bash
# マイグレーション履歴確認
docker-compose exec backend bash
alembic history

# データベースリセット（開発環境のみ）
docker-compose down -v
docker-compose up -d
```

---

## 📊 API 仕様

### 主要エンドポイント

- GET /health — ヘルスチェック
- GET /auth/test — Firebase 認証テスト
- GET /children — 子ども一覧取得
- POST /children — 子ども登録
- POST /api/voice/transcribe — 文字起こし保存・AI フィードバック生成
- GET /api/voice/history/{childId} — 子どもの音声履歴取得

### Swagger UI

```text
http://localhost:8000/docs
```

---

## 🔒 セキュリティ

### 環境変数管理（例）

```env
DB_HOST=db
DB_PORT=5432
DB_NAME=bud_db
DB_USER=postgres
DB_PASSWORD=secure_password

FIREBASE_PROJECT_ID=your_project_id
OPENAI_API_KEY=your_openai_key
```

---

## 📚 学習リソース

- FastAPI 公式ドキュメント: https://fastapi.tiangolo.com/
- SQLAlchemy 公式ドキュメント: https://docs.sqlalchemy.org/
- Python 公式ドキュメント: https://docs.python.org/3/
- pytest 公式ドキュメント: https://docs.pytest.org/
- Docker Compose 公式ドキュメント: https://docs.docker.com/compose/
