# Firebase サービスアカウントキーの設定手順

## 1. Firebase Consoleにアクセス
1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. プロジェクト `bud-app-4dd93` を選択

## 2. サービスアカウントキーの取得
1. 左側メニューの歯車アイコン → 「プロジェクトの設定」をクリック
2. 「サービスアカウント」タブを選択
3. 「Firebase Admin SDK」セクションで言語を「Python」に設定
4. 「新しい秘密鍵の生成」ボタンをクリック
5. 確認ダイアログで「キーを生成」をクリック
6. JSONファイルがダウンロードされます

## 3. ファイルの配置
1. ダウンロードしたJSONファイルを `serviceAccountKey.json` にリネーム
2. プロジェクトルート（`/Users/matsumotoryouko/Desktop/Section9_TeamC/`）に配置
3. 既存のダミーファイルを上書き

## 4. セキュリティ注意事項
⚠️ **重要**: `serviceAccountKey.json` は機密情報を含むため：
- Gitにコミットしない（.gitignoreに既に追加済み）
- 本番環境では環境変数や秘密管理サービスを使用
- ファイルの権限を適切に設定（読み取り専用）

## 5. 確認
```bash
# ファイルが正しく配置されたか確認
ls -la serviceAccountKey.json

# Dockerコンテナを再起動
docker-compose restart backend

# ログを確認
docker-compose logs backend --tail=10
```

## 期待される出力
正しく設定されると、バックエンドログに以下が表示されます：
```
✅ Firebase初期化完了
```

## トラブルシューティング
- エラー「Unable to load PEM file」が出る場合：JSONファイルが正しくダウンロードされていない
- エラー「Permission denied」が出る場合：ファイルの権限を確認 `chmod 644 serviceAccountKey.json`
- エラー「File not found」が出る場合：ファイルパスを確認