# 🎨 BUD Frontend

> Next.js 15 + TypeScript による小学生向け英会話アプリのフロントエンド

## 🚀 開発開始

### Docker環境での開発（推奨）

```bash
# フロントエンド開発環境に入る
docker-compose exec frontend sh

# 開発サーバー確認（Docker内で自動起動済み）
# http://localhost:3000 でアクセス可能
```

### ローカル環境での開発（参考）

```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 テスト実行

### Unit Test（Vitest）

```bash
# Docker環境でテスト実行
docker-compose exec frontend sh
npm run test

# カバレッジ測定
npm run test:coverage

# HTMLレポート確認（ローカルで）
open coverage/index.html
```

### E2E Test（Playwright）

```bash
# Docker環境でE2Eテスト実行
docker-compose exec frontend sh
npm run test:e2e

# UIモードで実行
npm run test:e2e:ui
```

### 品質チェック

```bash
# Docker環境でコード品質チェック
docker-compose exec frontend sh
npm run lint:front
npm run format:front
```

---

## 📊 現在の品質指標

- Unit Test: 22 tests passing
- E2E Test: 18 tests (Chrome/Firefox/Safari)
- Coverage: 89%（目標: 60%+）
- TypeScript: 完全型安全

---

## 🛠 技術スタック

### コア技術

- Framework: Next.js 15（App Router）
- Language: TypeScript
- Styling: Tailwind CSS + shadcn/ui
- Auth: Firebase Auth

### テスト・品質管理

- Unit Test: Vitest + React Testing Library
- E2E Test: Playwright（クロスブラウザ）
- Coverage: v8 provider
- Linting: ESLint + Prettier

---

## 📁 ディレクトリ構成

```text
frontend/
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── layout.tsx      # ルートレイアウト
│   │   ├── page.tsx        # ホームページ
│   │   └── (app)/          # 認証必須エリア
│   ├── components/         # 再利用可能コンポーネント
│   │   └── ui/             # shadcn/ui コンポーネント
│   ├── hooks/              # カスタムフック
│   ├── lib/                # ユーティリティ・設定
│   └── types/              # TypeScript型定義
├── __tests__/              # テストファイル
├── coverage/               # カバレッジレポート
└── playwright-report/      # E2Eテストレポート
```

---

## 🔧 開発ガイド

### Docker環境での開発フロー

```bash
# 1. Docker環境起動
docker-compose up -d

# 2. フロントエンドコンテナに入る
docker-compose exec frontend sh

# 3. 開発作業（ファイル編集はローカル、実行はDocker内）
```

### 新しいページの追加

```bash
# Docker環境で作業
docker-compose exec frontend sh

# 1. ページコンポーネント作成（ローカルで編集）
# src/app/(app)/[機能名]/page.tsx

# 2. テスト作成（ローカルで編集）
# src/__tests__/[機能名].test.tsx

# 3. テスト実行（Docker内）
npm run test
```

### API連携パターン

```ts
// src/lib/api/children.ts
export async function getChildren(): Promise<Child[]> {
  const response = await fetch(`${API_BASE_URL}/children`);
  if (!response.ok) throw new Error('Failed to fetch children');
  return response.json();
}
```

---

## 🐛 トラブルシューティング

### Docker関連のエラー

#### 1. コンテナに入れない

```bash
# コンテナ状態確認
docker-compose ps

# コンテナ再起動
docker-compose restart frontend
```

#### 2. ファイル変更が反映されない

```bash
# ボリュームマウント確認
docker-compose down
docker-compose up -d
```

### テスト実行エラー

#### 1. テスト実行エラー

```bash
# Docker環境でテスト実行
docker-compose exec frontend sh
npm run test

# エラー: テストファイルが見つからない場合
# src/__tests__/ ディレクトリ内にファイルがあるか確認
```

#### 2. E2Eテスト失敗

```bash
# Docker環境でブラウザインストール
docker-compose exec frontend sh
npx playwright install
```

### Firebase関連エラー

#### 1. Firebase認証エラー

```bash
# 環境変数確認
cat .env.local

# 必要な設定例:
# NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
# NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
```

---

## 🎯 開発のコツ

### Docker環境での効率的な開発

- ファイル編集: ローカルのエディタで編集
- コマンド実行: Docker環境で実行
- デバッグ: ブラウザの開発者ツールを活用

### デバッグ方法

```bash
# ログ確認
docker-compose logs frontend

# リアルタイムログ
docker-compose logs -f frontend
```

---

## 📚 学習リソース

### Next.js関連

- Next.js公式ドキュメント: https://nextjs.org/docs
- App Routerガイド: https://nextjs.org/docs/app

### テスト関連

- Vitest公式ドキュメント: https://vitest.dev/
- React Testing Library: https://testing-library.com/docs/react-testing-library/intro/
- Playwright公式ドキュメント: https://playwright.dev/

### Docker関連

- Docker Compose公式ドキュメント: https://docs.docker.com/compose/

---
