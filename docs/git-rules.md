# Git 運用ルール

プロジェクトの進行状況によって運用方法は変わります。

- 環境構築フェーズ：シンプルな運用
- 開発フェーズ：しっかりとしたレビュー体制

---

## 環境構築中

直接 develop にマージ OK な作業

以下の作業は PR なしで直接マージできます

OK 例

- README.md の更新
- .gitignore の作成・更新
- フォルダ構造の作成（frontend/, backend/など）
- 設計書・仕様書の追加
- package.json の初期作成

NG 例

- JavaScript や Python のコード
- 実行可能なファイル
- 他の人の作業に影響する変更

### 作業手順（直接マージ）

```
1. developから作業ブランチを作成
git checkout develop
git pull origin develop
git checkout -b feature/update-readme

2. 作業を実施
（ファイルを編集）

3. コミット
git add .
git commit -m "docs: READMEに環境構築手順を追加"

4. developに戻ってマージ
git checkout develop
git merge feature/update-readme

5. プッシュ
git push origin develop

6. 作業ブランチを削除
git branch -d feature/update-readme
```

---

## 開発フェーズ（環境構築完了）

下記が完了後、PR が必要となります。

- Docker 環境構築完了
- Linter/Formatter 設定完了
- 最初の画面実装開始

### ブランチ名の決め方

ISSUE に書いてあるブランチ名を使ってください

```
git checkout -b feature/FE-010-login-routing
```

コミットメッセージ規則

```
種類：日本語で簡潔に説明
```

種類一覧

- feat: 新機能追加
- fix: バグ修正
- update: 機能改善
- remove: 削除
- docs: ドキュメント
- style: コード整形（機能に影響なし）
- test: テスト追加・修正

---

## 作業の流れ（開発フェーズ）

1. 新機能を作る時

```
最新のdevelopを取得
git checkout develop
git pull origin develop

ISSUEに書いてあるブランチ名で作成
git checkout -b feature/FE-010-login-routing

作業・コミット
git add .
git commit -m "feat: ログイン画面のルーティングを設定"

プッシュ
git push origin feature/FE-010-login-routing
```

2. プルリクエスト作成

GitHub の PR テンプレートが自動で出てきます

```
## 📝 やったこと

<!-- 例：ログインボタンを追加した -->

## 🔗 関連 Issue

<!-- 下の行の#の後に番号を書くと自動でIssueが閉じます -->

close #

## 📸 スクショ

<!-- 画面の変更があれば画像を貼る（ドラッグ&ドロップでOK） -->

## ✅ チェックリスト
- [ ] 動作確認した
- [ ] エラーが出ない
- [ ] スマホでも確認した（画面系の場合）

## 💭 補足・相談

<!--
例：
- ○○の部分で迷いました
- ××はこういう理由でこうしました
- レビューで特に見てほしい：△△の部分
-->

## 🚀 マージ後にやること

<!-- あれば書く（例：環境変数の設定が必要） -->
```

---

### 困ったときは

| 状況               | 判断              |
| ------------------ | ----------------- |
| コードを含む？     | → PR 必須         |
| ドキュメントのみ？ | → 直接マージ OK   |
| 他の人に影響する？ | → PR 必須         |
| よくわからない     | → PR 作成（安全） |

### よくあるトラブル

- **ブランチ名がわからない** → GitHub の ISSUE に書いてある「ブランチ名」を確認
- **PR テンプレートが出てこない** → 既存テンプレートをコピペして利用
- **コンフリクト発生** → 以下で解決
  ```bash
  git checkout develop
  git pull origin develop
  git checkout feature/your-branch
  git merge develop
  ```
