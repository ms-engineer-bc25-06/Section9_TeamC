# 🌱 BUD - 子ども英語チャレンジアプリ

> **初学者チーム開発プロジェクト**  
> 小学生の英語学習を「録音 → AI 分析 → フィードバック」でサポート！

## 🎯 このアプリについて

**BUD（バド）** は小学生向けの英会話練習アプリです。

- 🎤 **録音**: お子さまの発音を録音
- 🤖 **AI 分析**: OpenAI で音声を文字起こし・評価
- 💬 **フィードバック**: 優しいコメントで成長をサポート
- 📊 **振り返り**: 学習の記録を親子で確認

詳しい企画内容は [📄 PRD](./docs/prd.md) をご覧ください。

---

## 🚀 5 分でスタート！

### 初回セットアップ

```bash
# 1. プロジェクトをクローン
git clone [リポジトリURL]
cd Section9_TeamC

# 2. Docker で一発起動
docker-compose up -d

# 3. ブラウザで確認
open http://localhost:3000  # フロントエンド
open http://localhost:8000  # バックエンドAPI
```

---

### 開発を始める

```
# フロントエンド開発
cd frontend
# 詳しくは frontend/README.md を参照

# バックエンド開発
cd backend
# 詳しくは backend/README.md を参照
```

詳細な環境構築: [📚 セットアップガイド](./docs/setup-detailed.md)

## 🧪 品質保証

### 現在の品質状況

- ✅ **Unit Test**: 22 tests passing
- ✅ **E2E Test**: 18 tests (3 ブラウザ対応)
- ✅ **カバレッジ**: 89% (目標 60%達成！)
- ✅ **TypeScript**: 完全型安全

### テスト実行

```bash
# フロントエンドテスト
cd frontend
npm run test              # Unit Test
npm run test:coverage     # カバレッジ測定
npm run test:e2e         # E2E Test

# 全体チェック
npm run check:all
```

## 🏗 技術構成

| 領域         | 技術                    | 選んだ理由               |
| ------------ | ----------------------- | ------------------------ |
| **フロント** | Next.js 15 + TypeScript | 初学者にも学習価値が高い |
| **バック**   | FastAPI + Python        | API が書きやすい         |
| **DB**       | PostgreSQL              | 実務でよく使われる       |
| **認証**     | Firebase Auth           | 安全で簡単               |
| **AI**       | OpenAI API              | 音声認識・自然言語処理   |

---

## 🤝 チーム開発ルール

### Git 運用フロー

```bash
# 1. 新機能開発の開始
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name

# 2. 開発・テスト
npm run test
git add .
git commit -m "feat: 機能の説明"

# 3. PR作成
git push -u origin feature/your-feature-name
# GitHubでPR作成 → develop へマージ
```

### コミットメッセージルール

- `feat: 新機能追加`
- `fix: バグ修正`
- `docs: ドキュメント更新`
- `test: テスト追加・修正`

---

## 📚 開発ガイド

### 🛠 技術別ガイド

- [🎨 フロントエンド開発](./frontend/README.md)
- [⚙️ バックエンド開発](./backend/README.md)

### 📋 設計・仕様書

- [PRD（プロダクト要求仕様）](./docs/prd.md)
- [データベース設計](./docs/database-design.md)
- [音声機能仕様](./docs/voice-feature.md)
- [セキュリティ設計](./docs/security.md)
- [テスト設計](./docs/test-design.md)

### 🔧 詳細セットアップ

- [環境構築詳細](./docs/setup-detailed.md)
- [Firebase 設定](./docs/firebase-setup.md)
- [プロジェクト構成](./docs/project-structure.md)

---

## ❗ よくあるトラブル

### 🐛 起動時のエラー

- **ポート競合**: `docker-compose down` してから再起動
- **DB 接続エラー**: `docker-compose down -v` でデータリセット
- **Firebase 認証エラー**: `serviceAccountKey.json` の配置確認

### 🔧 開発時のエラー

- **テスト失敗**: `npm run test:coverage` で詳細確認
- **型エラー**: 各 README.md のトラブルシューティング参照
- **ビルドエラー**: `npm run lint:front` でコード品質チェック

---

_最終更新: 2025 年 9 月 2 日_
