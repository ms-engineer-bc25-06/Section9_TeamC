# Firebase プロジェクト設定

## プロジェクト情報

- プロジェクト名: bud-app
- プロジェクト ID: bud-app-4dd93
- プロジェクト番号: 452615590558
- 作成日: 2025-08-05
- Google Analytics: 有効（日本地域）

## Web アプリ設定

- アプリ名: bud-web-app
- App ID: 1:452615590558:web:faec6b99aa56ef1f15a18f
- 設定完了日: 2025-08-05

## Authentication 設定

- Authentication: 有効 ✅
- Firebase SDK: インストール済み ✅
- 基本設定ファイル: lib/firebase.ts 作成済み ✅

## 次のステップ

- [x] Web アプリ追加 ✅
- [x] Authentication 有効化 ✅
- [x] Google プロバイダー設定 ✅

## 完了事項

- Google 認証機能実装完了
- 動作テスト完了 (2025-08-06)
- Firebase SDK: 10.12.5 (安定版)

---

## サービスアカウントキーの設定手順

### 1. Firebase Console にアクセス

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. プロジェクト `bud-app-4dd93` を選択

### 2. サービスアカウントキーの取得

1. 左側メニューの歯車アイコン → 「プロジェクトの設定」をクリック
2. 「サービスアカウント」タブを選択
3. 「Firebase Admin SDK」セクションで言語を「Python」に設定
4. 「新しい秘密鍵の生成」ボタンをクリック
5. 確認ダイアログで「キーを生成」をクリック
6. JSON ファイルがダウンロードされます

### 3. ファイルの配置

1. ダウンロードした JSON ファイルを `serviceAccountKey.json` にリネーム
2. プロジェクトルートに配置（既存のダミーファイルがあれば上書き）

### 4. セキュリティ注意事項

⚠️ 重要: `serviceAccountKey.json` は機密情報を含むため、以下を徹底してください。

- Git にコミットしない（.gitignore に追加済み）
- 本番環境では環境変数や秘密管理サービスを使用
- ファイルの権限を適切に設定（例: 読み取り専用）

### 5. 確認

```bash
# ファイルが正しく配置されたか確認
ls -la serviceAccountKey.json

# Dockerコンテナを再起動
docker-compose restart backend

# ログを確認
docker-compose logs backend --tail=10
```

#### 期待される出力

正しく設定されると、バックエンドログに以下が表示されます：

```
✅ Firebase初期化完了
```

### トラブルシューティング

- 「Unable to load PEM file」: JSON ファイルが破損している可能性。再ダウンロード
- 「Permission denied」: 権限を確認 `chmod 644 serviceAccountKey.json`
- 「File not found」: ファイル配置パスを確認
