# Alembic Docker環境での実行ガイド

## 概要
Docker環境でのAlembicデータベースマイグレーション実行手順とコマンドの説明

## 前提条件
- Docker Composeが起動していること
- PostgreSQLコンテナ（サービス名: `db`）が動作していること
- 環境変数（.env）が適切に設定されていること

## 基本コマンド

### 1. 初回セットアップ - Alembicディレクトリ初期化
```bash
# バックエンドディレクトリに移動
cd backend

# Alembicディレクトリがない場合のみ実行（通常は不要）
docker-compose exec backend alembic init alembic
```

### 2. 初期マイグレーションファイル作成
```bash
# 既存のmodelsから初期マイグレーションを自動生成
docker-compose exec backend alembic revision --autogenerate -m "Initial migration"
```
**説明:**
- `--autogenerate`: SQLAlchemyモデルとDBの差分を自動検出
- `-m "Initial migration"`: マイグレーションファイルにコメントを追加

### 3. マイグレーション実行（DBスキーマ更新）
```bash
# 最新のスキーマまでマイグレーション実行
docker-compose exec backend alembic upgrade head
```
**説明:**
- `upgrade`: マイグレーションを前進実行
- `head`: 最新のマイグレーションまで実行

### 4. マイグレーション状態確認
```bash
# 現在のマイグレーション状態を確認
docker-compose exec backend alembic current

# マイグレーション履歴を確認
docker-compose exec backend alembic history --verbose
```

### 5. 新しいマイグレーション作成（モデル変更後）
```bash
# モデル変更後の差分マイグレーション作成
docker-compose exec backend alembic revision --autogenerate -m "Add new column to users"
```

### 6. マイグレーション戻し（ロールバック）
```bash
# 1つ前のマイグレーションに戻す
docker-compose exec backend alembic downgrade -1

# 特定のリビジョンに戻す
docker-compose exec backend alembic downgrade <revision_id>
```

## 実行順序（初回セットアップ時）

1. **Docker Compose起動**
   ```bash
   docker-compose up -d db
   ```

2. **初期マイグレーション作成**
   ```bash
   docker-compose exec backend alembic revision --autogenerate -m "Initial migration"
   ```

3. **マイグレーション実行**
   ```bash
   docker-compose exec backend alembic upgrade head
   ```

4. **確認**
   ```bash
   docker-compose exec backend alembic current
   ```

## トラブルシューティング

### エラー: "Target database is not up to date"
```bash
# アップグレードを強制実行
docker-compose exec backend alembic upgrade head
```

### エラー: "Can't locate revision identified by"
```bash
# マイグレーション履歴をリセット（注意：開発環境のみ）
docker-compose exec backend alembic stamp head
```

### 環境変数が読み込まれない場合
```bash
# .envファイルが正しい場所にあることを確認
ls -la backend/.env

# Docker Composeを再起動
docker-compose down && docker-compose up -d
```

## 注意点

1. **本番環境では慎重に実行**: マイグレーションは不可逆的な変更を含む可能性
2. **バックアップ**: 本番データベースのマイグレーション前には必ずバックアップを取得
3. **段階的実行**: 複数のマイグレーションは段階的に実行して確認
4. **チーム共有**: マイグレーションファイルはバージョン管理に含めてチーム共有

## ファイル構造
```
backend/
├── alembic/
│   ├── versions/          # マイグレーションファイル格納
│   ├── env.py            # Alembic環境設定
│   └── script.py.mako    # マイグレーションテンプレート
├── alembic.ini           # Alembic設定ファイル
└── .env                  # 環境変数
```