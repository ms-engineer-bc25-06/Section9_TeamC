# BUD - チーム開発セットアップガイド

## 🚀 初回セットアップ手順

### 1️⃣ リポジトリクローン・環境準備
```bash
git clone [リポジトリURL]
cd Section9_TeamC
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
2️⃣ 環境変数設定
bash# フロントエンド環境変数
cp frontend/.env.local.template frontend/.env.local

# バックエンド環境変数  
cp backend/.env.template backend/.env

# Firebase認証ファイル配置（Slackで共有）
# serviceAccountKey.json をプロジェクトルートに配置
3️⃣ Docker環境起動
bashdocker-compose up -d
docker-compose ps  # 全サービス起動確認
curl http://localhost:8000/health  # API動作確認
✅ 動作確認チェックリスト

 http://localhost:3000 でアプリ表示
 http://localhost:8000/docs でSwagger UI表示
 Googleログインボタンが表示
 認証成功後、エラーなく画面遷移
 ブラウザコンソールにエラーがない

🚨 よくある問題と解決方法
Failed to fetch エラー
原因: API URL設定ミス
解決: frontend/.env.local の NEXT_PUBLIC_API_URL=http://localhost:8000/api を確認
バックエンドが起動しない
解決:
bashdocker-compose down
docker-compose build backend
docker-compose up -d
認証で500エラー
解決:
bash# ログ確認
docker-compose logs backend
# Firebase認証ファイル確認
ls -la serviceAccountKey.json
🎯 現在動作している機能

✅ Firebase Google認証
✅ ユーザー管理API
✅ データベース統合
✅ レスポンシブUI


動作確認済み: 2025年8月12日
