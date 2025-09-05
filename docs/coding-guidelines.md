# コーディング規約

## 共通：全体方針

| 項目           | 内容                                      |
| -------------- | ----------------------------------------- |
| フレームワーク | Next.js（App Router） + FastAPI           |
| 言語           | TypeScript（フロント）＋ Python（バック） |
| デザイン       | Tailwind CSS + shadcn/ui                  |
| UI 方針        | モバイルファースト（iPhone 中心）         |
| API 通信       | REST 形式（OpenAPI で管理）               |
| 認証           | Firebase Auth（Google ログイン）          |

---

## フロントエンド（Next.js + TypeScript）

### 使用技術

- TypeScript + App Router
- Tailwind CSS
- shadcn/ui
- Web Speech API（音声入力・文字起こし）
- Firebase Auth（Google ログイン）

### コーディングスタイル

| 項目           | 内容                           |
| -------------- | ------------------------------ |
| フォーマッター | Prettier（保存時に自動整形）   |
| リンター       | ESLint（Next.js 公式推奨構成） |
| セミコロン     | 必ず付ける（`semi: true`）     |
| クォート       | シングルクォート（`'`）        |
| インデント     | スペース 2                     |

### 命名規則

| 種類             | 命名規則                        | 例                             |
| ---------------- | ------------------------------- | ------------------------------ |
| 変数・関数名     | camelCase                       | `userName`, `getCountryList()` |
| コンポーネント名 | PascalCase                      | `UserCard`, `ChallengeForm`    |
| フォルダ名       | kebab-case                      | `components/`, `hooks/`        |
| 型名             | PascalCase                      | `ChallengeData`                |
| ファイル拡張子   | `.tsx`（UI）, `.ts`（ロジック） | ー                             |

### ディレクトリ構成（実装ベース）

````bash
frontend/
├── public/                  # 静的ファイル（画像・アイコンなど）
├── src/                     # アプリ本体
│   ├── app/                 # App Router ルート
│   ├── components/          # UIコンポーネント
│   ├── features/            # ドメイン単位のロジック
│   ├── hooks/               # カスタムフック
│   ├── lib/                 # Firebase設定・APIクライアントなど
│   ├── types/               # 型定義（DTO, APIレスポンス）
│   └── utils/               # 汎用関数
├── e2e/                     # PlaywrightによるE2Eテスト
├── playwright-report/       # E2Eテストレポート
├── .eslintrc.json           # ESLint設定
├── .prettierrc              # Prettier設定
├── eslint.config.mjs        # Flat ESLint設定
├── next.config.js           # Next.js設定
├── tailwind.config.ts       # Tailwind CSS設定
├── postcss.config.ts        # PostCSS設定
├── playwright.config.ts     # Playwright設定
├── vitest.config.ts         # Vitest設定
├── package.json             # フロント依存パッケージ
├── tsconfig.json            # TypeScript設定
└── README.md                # frontend用README

### UI・スタイル

- UIは **shadcn/ui** をベースに実装
- デザインは **Tailwind CSS のユーティリティクラス**で完結
- レスポンシブ対応は **`sm:` / `md:` ブレークポイント**を積極的に使用
- 共通コンポーネントは **`components/` ディレクトリ**に配置し、再利用性を高める

---

## バックエンド（Python + FastAPI）

### 使用技術
- FastAPI（ASGI）
- PostgreSQL（記録保存用）
- Pydantic（スキーマ管理）
- CORS設定あり（フロントと連携のため）
- OpenAI API（AIフィードバック生成）
- Firebase Auth（IDトークン検証）

### コーディングスタイル
- **Black** を使用（デフォルト設定）
- **Ruff** を使用（デフォルト設定、PEP8準拠 / 行長88文字）
- **isort** を使用（デフォルト設定で import 順序を整理）
- 設定ファイルは `backend/pyproject.toml` にコメントアウトで残しているが、現状はすべてデフォルト設定で運用中

### 命名規則

| 種類     | 命名規則 | 例 |
| -------- | -------- | ---------------- |
| 関数名   | snake_case | `get_user_data()` |
| クラス名 | PascalCase | `UserSchema` |
| 変数名   | snake_case | `audio_url`, `user_id` |
| モジュール | lowercase_with_underscores | `auth_routes.py` |

### ディレクトリ構成（実装ベース）

```bash
backend/
├── alembic/                 # DBマイグレーション管理
│   ├── versions/            # マイグレーションスクリプト
│   └── env.py
├── app/
│   ├── api/
│   │   ├── routers/         # ルーティング層 (auth, children, voice, ai_feedback など)
│   │   └── schemas/         # Pydanticモデル
│   ├── constants/           # 定数（メッセージ、設定値など）
│   ├── core/                # 設定・DB接続・ロギング・監視
│   ├── middleware/          # ミドルウェア（エラーハンドラ、モニタリング）
│   ├── models/              # SQLAlchemyモデル
│   ├── services/            # ビジネスロジック（AIフィードバック、音声処理、ユーザー管理など）
│   ├── utils/               # ユーティリティ関数（認証など）
│   ├── main.py              # FastAPIエントリポイント
│   └── config.py            # アプリケーション設定
├── database/                # DB接続や初期化スクリプト
├── tests/                   # Pytestベースのテストコード
├── .env.example             # 環境変数サンプル
├── alembic.ini              # Alembic設定
├── Dockerfile.dev           # 開発用Dockerfile
├── Dockerfile.prod          # 本番用Dockerfile
├── pyproject.toml           # Black/Ruff/isort 設定 (コメントアウトあり)
├── requirements.txt         # 本番依存パッケージ
├── requirements-dev.txt     # 開発用依存パッケージ
└── README.md                # backend用README

## 認証・セキュリティ規約

- Firebase Auth を使った Googleログインのみ許可
- フロントからの API 呼び出しには **`Authorization: Bearer <IDトークン>` ヘッダー送信必須**
- Whisper API などの音声処理はバックエンド経由で行う（フロントから直接呼ばない）
- 音声ファイルは保存せず、**文字起こし結果のみをDBに保存**
- 個人情報を含むデータはログに残さない

---

## API連携時のルール

- 各エンドポイントは用途に応じた JSON を返却する
- 成功時: 必要な業務データを返却
- エラー時:
  ```json
  { "detail": "エラーメッセージ" }

- 認証必須APIは、必ず **`Authorization: Bearer <Firebase ID Token>`** を送信する
- 非同期処理は **`fetch`（フロント） / `async def`（FastAPI）** で統一
````
