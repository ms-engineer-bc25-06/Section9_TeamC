# BUD - 開発環境構築ガイド

このガイドに従って、BUD プロジェクトのローカル開発環境を構築してください。

## 📋 前提条件

開発を始める前に、以下のツールがインストールされていることを確認してください：

### 必須ツール

- **Node.js**: `20.x` 以上 ([公式サイト](https://nodejs.org/))
- **Python**: `3.11` 以上 ([公式サイト](https://www.python.org/))
- **Docker**: 最新版 ([公式サイト](https://www.docker.com/))
- **Docker Compose**: Docker Desktop に含まれています
- **Git**: 最新版

### バージョン確認

```bash
node --version    # v20.x.x
python --version  # Python 3.11.x
docker --version  # Docker version 24.x.x
git --version     # git version 2.x.x
```

## 🚀 クイックスタート

### 1. リポジトリのクローン

```bash
git clone https://github.com/ms-engineer-bc25-06/Section9_TeamC.git
cd Section9_TeamC
```

### 2. 環境変数の設定

```bash
# ルートディレクトリで環境変数ファイルをコピー
cp .env.example .env

# フロントエンド用
cp frontend/.env.example frontend/.env.local

# バックエンド用
cp backend/.env.example backend/.env
```

### 3. Docker 環境の立ち上げ

```bash
# すべてのサービスを一括起動
docker-compose up -d

# 初回のみ：データベースマイグレーション実行
docker-compose exec backend python -m alembic upgrade head
```

### 4. 動作確認

- **フロントエンド**: http://localhost:3000
- **バックエンド API**: http://localhost:8000
- **API 仕様書**: http://localhost:8000/docs
- **PostgreSQL**: localhost:5432

---

## 🔧 詳細セットアップ手順

### フロントエンド環境構築

#### 1. 依存関係のインストール

```bash
cd frontend
npm install
```

#### 2. 環境変数設定 (`frontend/.env.local`)

```env
# Next.js設定
NEXT_PUBLIC_API_URL=http://localhost:8000

# Firebase設定（開発用）
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id

# 音声機能設定
NEXT_PUBLIC_VOICE_FEATURE_ENABLED=true
NEXT_PUBLIC_WHISPER_API_KEY=your_openai_api_key  # A案採用時
```

#### 3. 開発サーバー起動

```bash
npm run dev
```

### バックエンド環境構築

#### 1. 仮想環境の作成（任意・Docker 使用時は不要）

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

#### 2. 依存関係のインストール

```bash
pip install -r requirements.txt
```

#### 3. 環境変数設定 (`backend/.env`)

```env
# データベース設定
DATABASE_URL=postgresql://bud_user:bud_password@localhost:5432/bud_db

# Firebase Admin SDK
FIREBASE_ADMIN_SDK_PATH=./config/firebase-admin-sdk.json

# 音声機能設定
OPENAI_API_KEY=your_openai_api_key  # Whisper API用

# セキュリティ設定
SECRET_KEY=your_super_secret_key_here
CORS_ORIGINS=http://localhost:3000

# 開発モード
DEBUG=true
ENVIRONMENT=development
```

#### 4. データベースマイグレーション

```bash
# マイグレーションファイル生成
python -m alembic revision --autogenerate -m "初期テーブル作成"

# マイグレーション実行
python -m alembic upgrade head
```

#### 5. 開発サーバー起動

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

## 🐳 Docker 環境の詳細

### Docker Compose 構成

```yaml
# docker-compose.yml の主要サービス
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    depends_on:
      - db

  db:
    image: postgres:15
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: bud_db
      POSTGRES_USER: bud_user
      POSTGRES_PASSWORD: bud_password
```

### よく使う Docker コマンド

```bash
# サービス一括起動
docker-compose up -d

# ログ確認
docker-compose logs frontend  # フロントエンドのログ
docker-compose logs backend   # バックエンドのログ
docker-compose logs db        # データベースのログ

# サービス再起動
docker-compose restart frontend
docker-compose restart backend

# データベースに接続
docker-compose exec db psql -U bud_user -d bud_db

# バックエンドコンテナに入る
docker-compose exec backend bash

# 環境をクリーンアップ
docker-compose down -v  # ボリュームも削除
```

---

## 🛠️ 開発ツールの設定

### ESLint / Prettier 設定

#### フロントエンド

```bash
cd frontend

# ESLint実行
npm run lint

# Prettier実行
npm run format

# 型チェック
npm run type-check
```

#### バックエンド

```bash
cd backend

# ruff（静的解析）
ruff check .

# black（フォーマット）
black .

# 型チェック
mypy .
```

### Husky + lint-staged 設定

プリコミットフックが自動で設定されます：

```bash
# 初回のみ実行（package.jsonのpostinstallで自動実行済み）
npx husky install
```

### Git 設定

```bash
# Conventional Commits用のコミットテンプレート設定
git config commit.template .gitmessage
```

---

## 🔥 Firebase 設定

### 1. Firebase プロジェクト作成

1. [Firebase Console](https://console.firebase.google.com/) でプロジェクト作成
2. Authentication を有効化
3. Google 認証プロバイダーを設定

### 2. 設定ファイル取得

```bash
# フロントエンド用設定（Web）
# Firebase Console → プロジェクト設定 → アプリ追加 → Web

# バックエンド用設定（Admin SDK）
# Firebase Console → プロジェクト設定 → サービスアカウント
# 「新しい秘密鍵の生成」→ backend/config/ に保存
```

---

## 🧪 テスト環境設定

### フロントエンドテスト

```bash
cd frontend

# Vitest実行
npm run test

# Playwright E2Eテスト
npm run test:e2e

# テストカバレッジ
npm run test:coverage
```

### バックエンドテスト

```bash
cd backend

# pytest実行
pytest

# カバレッジ付きテスト
pytest --cov=app --cov-report=html
```

---

## 🎤 音声機能の設定

### Web Speech API（B 案）

- ブラウザの音声認識機能を使用
- Chrome/Edge で最適な動作
- 追加設定不要

### Whisper API（A 案）

```bash
# OpenAI APIキーを環境変数に設定
export OPENAI_API_KEY=your_openai_api_key

# バックエンドで音声ファイル処理
pip install openai-whisper
```

---

## ❗ トラブルシューティング

### よくある問題と解決方法

#### 1. Docker 関連

```bash
# ポートが既に使用されている
docker-compose down
sudo lsof -ti:3000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :3000        # Windows

# データベース接続エラー
docker-compose restart db
docker-compose logs db
```

#### 2. Node.js 関連

```bash
# node_modules関連のエラー
rm -rf node_modules package-lock.json
npm install

# 型エラー
npm run type-check
```

#### 3. Python 関連

```bash
# 依存関係エラー
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall

# マイグレーションエラー
python -m alembic stamp head
python -m alembic revision --autogenerate -m "fix"
```

#### 4. 環境変数エラー

```bash
# 設定確認
docker-compose config
cat .env
```

### デバッグ情報収集

```bash
# システム情報
node --version
python --version
docker --version

# サービス状態確認
docker-compose ps
docker-compose logs --tail=50
```

---

## 📞 ヘルプ・質問

環境構築で困った場合：

1. **このガイドの手順を再確認**
2. **トラブルシューティングセクションを確認**
3. **GitHub Issues で質問** - [Issue 作成](https://github.com/ms-engineer-bc25-06/Section9_TeamC/issues/new)
4. **チーム Slack で相談**

### 有用なリソース

- [Next.js 公式ドキュメント](https://nextjs.org/docs)
- [FastAPI 公式ドキュメント](https://fastapi.tiangolo.com/)
- [Docker 公式ドキュメント](https://docs.docker.com/)
- [PostgreSQL 公式ドキュメント](https://www.postgresql.org/docs/)

---

**🎉 環境構築完了後、`http://localhost:3000` で BUD アプリが表示されれば成功です！**
