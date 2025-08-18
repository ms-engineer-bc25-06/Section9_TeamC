# 環境セットアップガイド

このガイドでは、プロジェクトの開発環境を構築する手順を説明します。

## 📋 必要な前提条件

開発を始める前に、以下のツールがインストールされていることを確認してください。

### 必須ツール

- **Docker Desktop** (v4.0 以上)

  - [公式サイト](https://www.docker.com/products/docker-desktop/)からダウンロード
  - Windows/Mac/Linux 対応版を選択
  - インストール後、Docker Desktop を起動して動作確認

- **Git** (v2.30 以上)

  - [公式サイト](https://git-scm.com/)からダウンロード
  - インストール確認: `git --version`

- **Visual Studio Code** (推奨)
  - [公式サイト](https://code.visualstudio.com/)からダウンロード
  - 推奨拡張機能:
    - Docker
    - ESLint
    - Prettier
    - Python
    - TypeScript/JavaScript

### 推奨環境

- **OS**: macOS 11 以上 / Windows 10 以上 / Ubuntu 20.04 以上
- **メモリ**: 8GB 以上（Docker 用に 4GB 以上割り当て推奨）
- **ストレージ**: 10GB 以上の空き容量

## 🚀 環境構築手順

### 1. リポジトリのクローン

```bash
# HTTPSを使用する場合
git clone https://github.com/ms-engineer-bc25-06/Section9_TeamC.git

# SSHを使用する場合（推奨）
git clone git@github.com:ms-engineer-bc25-06/Section9_TeamC.git

# プロジェクトディレクトリへ移動
cd Section9_TeamC
```

### 2. 環境変数の設定

#### バックエンド環境変数（必須）

```bash
# backend/.env.exampleをコピー
cp backend/.env.example backend/.env
```

`backend/.env`を編集して、以下の値を設定：

```env
# データベース設定
DB_HOST=db
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_secure_password

# アプリケーション設定
PORT=8000
NODE_ENV=development

# JWT設定（本番環境では必ず変更）
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# その他の設定
CORS_ORIGIN=http://localhost:3000
```

#### フロントエンド環境変数（必要に応じて）

```bash
# frontend/.env.localを作成
touch frontend/.env.local
```

`frontend/.env.local`に以下を設定：

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Docker コンテナの起動

```bash
# Docker Desktopが起動していることを確認

# 開発環境の起動（初回はイメージのビルドに時間がかかります）
docker-compose up -d

# ログを確認しながら起動したい場合
docker-compose up
```

### 4. データベースの初期化

```bash
# データベースマイグレーションの実行
docker-compose exec backend npm run migrate

# 初期データの投入（必要に応じて）
docker-compose exec backend npm run seed
```

## ✅ 動作確認方法

### 1. ブラウザでのアクセス確認

以下の URL にアクセスして、各サービスが正常に動作していることを確認：

- **フロントエンド**: http://localhost:3000
  - トップページが表示されることを確認
- **バックエンド API**: http://localhost:8000
  - API のヘルスチェック: http://localhost:8000/health
  - レスポンス例: `{"status": "healthy", "timestamp": "2024-01-01T00:00:00Z"}`

### 2. API 動作確認

```bash
# ヘルスチェックAPI
curl http://localhost:8000/health

# APIバージョン確認
curl http://localhost:8000/api/version
```

### 3. データベース接続確認

```bash
# PostgreSQLコンテナに接続
docker-compose exec db psql -U your_database_user -d your_database_name

# テーブル一覧を表示
\dt

# 接続を終了
\q
```

### 4. ログの確認

```bash
# 全サービスのログ
docker-compose logs

# 特定サービスのログ（例：backend）
docker-compose logs backend

# リアルタイムでログを確認
docker-compose logs -f
```

## 💻 日常の開発フロー

### サービスの起動・停止

```bash
# すべてのサービスを起動
docker-compose up -d

# すべてのサービスを停止
docker-compose down

# 特定のサービスのみ再起動（例：backend）
docker-compose restart backend

# コンテナの状態確認
docker-compose ps
```

### コードの変更と反映

- **フロントエンド**: ファイル保存時に自動的にホットリロード
- **バックエンド**: ファイル保存時に nodemon が自動的に再起動

### データベース操作

```bash
# マイグレーションの作成
docker-compose exec backend npm run migrate:create -- migration_name

# マイグレーションの実行
docker-compose exec backend npm run migrate

# マイグレーションのロールバック
docker-compose exec backend npm run migrate:rollback
```

### テストの実行

```bash
# バックエンドのテスト
docker-compose exec backend npm test

# フロントエンドのテスト
docker-compose exec frontend npm test

# E2Eテスト
docker-compose exec frontend npm run test:e2e
```

### ビルドとデプロイ準備

```bash
# プロダクションビルド
docker-compose -f docker-compose.prod.yml build

# ビルドしたイメージの確認
docker images
```

## 🔧 トラブルシューティング

### よくある問題と解決法

#### 1. Docker コンテナが起動しない

**症状**: `docker-compose up`実行時にエラーが発生

**解決方法**:

```bash
# Docker Desktopが起動していることを確認
docker version

# 古いコンテナとボリュームを削除
docker-compose down -v

# イメージを再ビルド
docker-compose build --no-cache

# 再度起動
docker-compose up -d
```

#### 2. ポートが既に使用されている

**症状**: `bind: address already in use`エラー

**解決方法**:

```bash
# 使用中のポートを確認（例：3000番ポート）
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows

# プロセスを終了するか、docker-compose.ymlでポート番号を変更
```

#### 3. データベース接続エラー

**症状**: `ECONNREFUSED`または`connection refused`エラー

**解決方法**:

```bash
# データベースコンテナのログを確認
docker-compose logs db

# .envファイルの設定を確認
cat backend/.env

# データベースコンテナを再起動
docker-compose restart db
```

#### 4. npm install が失敗する

**症状**: パッケージのインストール中にエラー

**解決方法**:

```bash
# node_modulesとpackage-lock.jsonを削除
docker-compose exec backend rm -rf node_modules package-lock.json

# キャッシュをクリア
docker-compose exec backend npm cache clean --force

# 再インストール
docker-compose exec backend npm install
```

#### 5. メモリ不足エラー

**症状**: `JavaScript heap out of memory`エラー

**解決方法**:

- Docker Desktop の設定でメモリ割り当てを増やす
  - Settings → Resources → Memory を 4GB 以上に設定
- 不要なコンテナを停止：`docker system prune -a`

### ログファイルの場所

- **Docker ログ**: `docker-compose logs [service_name]`
- **アプリケーションログ**:
  - Backend: `backend/logs/`
  - Frontend: ブラウザのコンソール

### デバッグモードの有効化

```bash
# バックエンドのデバッグモード
docker-compose exec backend npm run dev:debug

# VS Codeでのリモートデバッグ設定は.vscode/launch.jsonを参照
```

## 🔒 セキュリティ注意事項

### 環境変数の管理

#### ⚠️ 重要な注意点

1. **`.env`ファイルは絶対に Git にコミットしない**

   - `.gitignore`に含まれていることを確認
   - 誤ってコミットした場合は、すぐに履歴から削除

2. **環境ごとに異なる設定を使用**

   ```bash
   # 開発環境
   cp .env.development .env

   # ステージング環境
   cp .env.staging .env

   # 本番環境（別途管理）
   ```

3. **シークレットキーの生成**
   ```bash
   # 安全なランダムキーの生成
   openssl rand -hex 32
   ```

### 本番環境での変更点

#### 1. 環境変数の設定

本番環境では以下の設定を必ず変更：

```env
# 本番環境の.env例
NODE_ENV=production
JWT_SECRET=[強力なランダム文字列]
DB_PASSWORD=[複雑なパスワード]
CORS_ORIGIN=https://your-production-domain.com
```

#### 2. SSL/TLS 証明書の設定

```yaml
# docker-compose.prod.ymlでHTTPS設定
services:
  nginx:
    volumes:
      - ./ssl/cert.pem:/etc/nginx/ssl/cert.pem
      - ./ssl/key.pem:/etc/nginx/ssl/key.pem
```

#### 3. セキュリティヘッダーの設定

```javascript
// バックエンドでのセキュリティヘッダー設定
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);
```

#### 4. データベースのセキュリティ

- 本番環境では別のデータベースサーバーを使用
- 接続は SSL/TLS で暗号化
- 定期的なバックアップの実施
- 最小権限の原則に基づくユーザー設定

#### 5. ログとモニタリング

```bash
# ログの収集と監視
docker-compose logs -f | grep ERROR

# アクセスログの監視
tail -f /var/log/nginx/access.log
```

### セキュリティチェックリスト

- [ ] すべての環境変数が適切に設定されている
- [ ] `.env`ファイルが Gitignore に含まれている
- [ ] 本番環境のパスワードが十分に強力
- [ ] HTTPS が有効になっている（本番環境）
- [ ] セキュリティヘッダーが設定されている
- [ ] 不要なポートが閉じられている
- [ ] 定期的なセキュリティアップデートの適用
- [ ] ログの監視体制が整っている

## 📚 参考リンク

- [Docker 公式ドキュメント](https://docs.docker.com/)
- [Docker Compose リファレンス](https://docs.docker.com/compose/)
- [PostgreSQL ドキュメント](https://www.postgresql.org/docs/)
- [Node.js ベストプラクティス](https://github.com/goldbergyoni/nodebestpractices)
- [Next.js ドキュメント](https://nextjs.org/docs)

## 🤝 サポート

問題が解決しない場合は、以下の方法でサポートを受けられます：

GitHub の Issues: [Issues](https://github.com/ms-engineer-bc25-06/Section9_TeamC/issues)

---

最終更新日: 2025 年 8 月
