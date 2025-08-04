# BUD - 性能設計・モニタリングガイド

BUD アプリケーションの性能要件、最適化手法、モニタリング方針を定義します。

## 🎯 性能目標・要件

### フロントエンド性能目標

| 指標                               | 目標値   | 重要度 |
| ---------------------------------- | -------- | ------ |
| **First Contentful Paint (FCP)**   | < 1.5 秒 | 高     |
| **Largest Contentful Paint (LCP)** | < 2.5 秒 | 高     |
| **Cumulative Layout Shift (CLS)**  | < 0.1    | 中     |
| **First Input Delay (FID)**        | < 100ms  | 高     |
| **Time to Interactive (TTI)**      | < 3 秒   | 中     |

### バックエンド API 性能目標

| 指標               | 目標値         | 重要度 |
| ------------------ | -------------- | ------ |
| **レスポンス時間** | < 200ms (平均) | 高     |
| **スループット**   | > 100 req/sec  | 中     |
| **エラー率**       | < 0.1%         | 高     |
| **可用性**         | > 99.5%        | 高     |

### 音声機能性能目標

| 機能                    | 目標値  | 備考               |
| ----------------------- | ------- | ------------------ |
| **音声認識開始時間**    | < 500ms | Web Speech API     |
| **音声 → テキスト変換** | < 2 秒  | Whisper API 利用時 |
| **音声ファイルサイズ**  | < 5MB   | 1 分間の録音想定   |

---

## 🖥️ フロントエンド性能最適化

### Next.js 最適化手法

#### 1. 画像最適化

```typescript
// next/imageを活用した最適化
import Image from "next/image";

export function ProfileImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={200}
      height={200}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
      priority={false} // LCPに影響する画像のみtrue
    />
  );
}
```

#### 2. コードスプリッティング

```typescript
// 動的インポートでバンドルサイズ削減
import dynamic from "next/dynamic";

const VuiceRecorder = dynamic(() => import("../components/VoiceRecorder"), {
  loading: () => <div>音声機能を読み込み中...</div>,
  ssr: false, // クライアントサイドでのみ必要な場合
});
```

#### 3. データフェッチング最適化

```typescript
// SWRでキャッシュとリアルタイム更新
import useSWR from "swr";

export function ConversationList() {
  const { data, error } = useSWR("/api/conversations", fetcher, {
    refreshInterval: 30000, // 30秒間隔で更新
    revalidateOnFocus: true,
    dedupingInterval: 5000, // 5秒間は重複リクエスト防止
  });

  return <div>{/* コンポーネント内容 */}</div>;
}
```

#### 4. バンドル最適化

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // バンドル分析
  bundleAnalyzer: process.env.ANALYZE === "true",

  // 実験的機能でバンドルサイズ削減
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ["lucide-react"],
  },

  // 外部ライブラリの最適化
  transpilePackages: ["@/components/ui"],
};
```

### パフォーマンス監視

#### Web Vitals 測定

```typescript
// pages/_app.tsx
import { reportWebVitals } from "../utils/analytics";

export function reportWebVitals(metric) {
  // Google Analytics 4 に送信
  if (process.env.NODE_ENV === "production") {
    gtag("event", metric.name, {
      custom_parameter: metric.value,
      event_category: "Web Vitals",
      event_label: metric.id,
      non_interaction: true,
    });
  }

  // 開発環境ではコンソール出力
  if (process.env.NODE_ENV === "development") {
    console.log(`${metric.name}: ${metric.value}`);
  }
}
```

---

## ⚡ バックエンド API 性能最適化

### FastAPI 最適化手法

#### 1. データベースクエリ最適化

```python
# SQLAlchemyでN+1問題解決
from sqlalchemy.orm import joinedload

async def get_conversations_with_messages(db: Session, user_id: int):
    """会話リストとメッセージを効率的に取得"""
    return db.query(Conversation)\
        .options(joinedload(Conversation.messages))\
        .filter(Conversation.user_id == user_id)\
        .all()

# インデックス設計
# CREATE INDEX idx_conversations_user_id ON conversations(user_id);
# CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
# CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
```

#### 2. レスポンスキャッシュ

```python
from fastapi_cache import FastAPICache
from fastapi_cache.decorator import cache
from fastapi_cache.backends.redis import RedisBackend

@cache(expire=300)  # 5分間キャッシュ
async def get_user_conversations(user_id: int):
    """ユーザーの会話リストをキャッシュ付きで取得"""
    return await conversation_service.get_by_user_id(user_id)
```

#### 3. 非同期処理活用

```python
import asyncio
from concurrent.futures import ThreadPoolExecutor

async def process_voice_to_text(audio_file: bytes) -> str:
    """音声ファイルを非同期でテキスト変換"""
    loop = asyncio.get_event_loop()

    with ThreadPoolExecutor() as executor:
        # CPU集約的な処理を別スレッドで実行
        result = await loop.run_in_executor(
            executor,
            whisper_client.transcribe,
            audio_file
        )

    return result
```

#### 4. レスポンス最適化

```python
from fastapi import FastAPI
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse

app = FastAPI()

# Gzip圧縮でレスポンスサイズ削減
app.add_middleware(GZipMiddleware, minimum_size=1000)

# レスポンスモデルでデータ量制御
class ConversationResponse(BaseModel):
    id: int
    title: str
    updated_at: datetime
    message_count: int  # メッセージ内容は含めない

    class Config:
        from_attributes = True
```

### データベース性能最適化

#### 1. インデックス設計

```sql
-- 会話検索用インデックス
CREATE INDEX CONCURRENTLY idx_conversations_user_created
ON conversations(user_id, created_at DESC);

-- メッセージ全文検索用インデックス
CREATE INDEX CONCURRENTLY idx_messages_content_gin
ON messages USING gin(to_tsvector('japanese', content));

-- 音声データ検索用
CREATE INDEX CONCURRENTLY idx_voice_records_status
ON voice_records(status, created_at)
WHERE status IN ('processing', 'completed');
```

#### 2. 接続プール設定

```python
# database.py
from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,          # 基本接続数
    max_overflow=30,       # 最大追加接続数
    pool_pre_ping=True,    # 接続の生存確認
    pool_recycle=3600,     # 1時間で接続をリサイクル
    echo=False             # 本番環境ではFalse
)
```

---

## 🎤 音声機能性能最適化

### Web Speech API 最適化

```typescript
// 音声認識の最適化設定
const startVoiceRecognition = () => {
  const recognition = new (window as any).webkitSpeechRecognition();

  // 性能チューニング
  recognition.continuous = true; // 連続認識
  recognition.interimResults = true; // 途中結果も取得
  recognition.maxAlternatives = 1; // 候補数を制限
  recognition.lang = "ja-JP"; // 日本語設定

  // タイムアウト設定
  setTimeout(() => {
    recognition.stop();
  }, 30000); // 30秒でタイムアウト

  return recognition;
};
```

### Whisper API 最適化

```python
import openai
from typing import BinaryIO

async def transcribe_audio_optimized(audio_file: BinaryIO) -> str:
    """Whisper APIを最適化して使用"""

    # ファイルサイズチェック（25MB制限）
    if audio_file.size > 25 * 1024 * 1024:
        raise ValueError("音声ファイルが大きすぎます")

    # 音質と処理速度のバランス
    response = await openai.Audio.atranscribe(
        model="whisper-1",
        file=audio_file,
        language="ja",           # 日本語指定で高速化
        response_format="json",  # JSONレスポンス
        temperature=0.2         # 安定した結果を得る
    )

    return response["text"]
```

---

## 📊 性能モニタリング・計測

### フロントエンド監視

#### 1. Real User Monitoring (RUM)

```typescript
// utils/performance.ts
export class PerformanceMonitor {
  static measurePageLoad() {
    if (typeof window !== "undefined") {
      window.addEventListener("load", () => {
        const navigation = performance.getEntriesByType("navigation")[0];
        const paintEntries = performance.getEntriesByType("paint");

        // Core Web Vitals測定
        new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === "largest-contentful-paint") {
              console.log("LCP:", entry.startTime);
              // 分析ツールに送信
            }
          });
        }).observe({ entryTypes: ["largest-contentful-paint"] });
      });
    }
  }

  static measureApiCall(url: string, startTime: number) {
    const duration = performance.now() - startTime;

    // 遅いAPIコールを記録
    if (duration > 1000) {
      console.warn(`Slow API call: ${url} took ${duration}ms`);
    }

    return duration;
  }
}
```

#### 2. バンドルサイズ監視

```bash
# package.jsonに追加
{
  "scripts": {
    "analyze": "ANALYZE=true npm run build",
    "build-stats": "npm run build && npx bundlesize"
  },
  "bundlesize": [
    {
      "path": ".next/static/js/**/*.js",
      "maxSize": "250kb",
      "compression": "gzip"
    }
  ]
}
```

### バックエンド監視

#### 1. API 性能監視

```python
import time
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

class PerformanceMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()

        response = await call_next(request)

        process_time = time.time() - start_time

        # 遅いリクエストをログ出力
        if process_time > 0.5:  # 500ms以上
            logger.warning(
                f"Slow request: {request.method} {request.url.path} "
                f"took {process_time:.3f}s"
            )

        # レスポンスヘッダーに処理時間を追加
        response.headers["X-Process-Time"] = str(process_time)

        return response
```

#### 2. データベース性能監視

```python
from sqlalchemy import event
from sqlalchemy.engine import Engine
import logging

logging.basicConfig()
logger = logging.getLogger("sqlalchemy.engine")

@event.listens_for(Engine, "before_cursor_execute")
def receive_before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    context._query_start_time = time.time()

@event.listens_for(Engine, "after_cursor_execute")
def receive_after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    total = time.time() - context._query_start_time

    # 遅いクエリを記録（100ms以上）
    if total > 0.1:
        logger.warning(f"Slow query: {total:.3f}s - {statement[:100]}...")
```

---

## 🔧 性能テスト・負荷テスト

### フロントエンド性能テスト

#### 1. Lighthouse CI

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [push, pull_request]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli@0.12.x
          lhci autorun
```

#### 2. Bundle Analyzer

```bash
# 定期的にバンドルサイズを確認
npm run analyze

# 依存関係の重複チェック
npx duplicate-package-checker-webpack-plugin
```

### バックエンド負荷テスト

#### 1. Locust 負荷テスト

```python
# tests/load_test.py
from locust import HttpUser, task, between

class BudUser(HttpUser):
    wait_time = between(1, 3)

    def on_start(self):
        # ログイン処理
        self.client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "password"
        })

    @task(3)
    def get_conversations(self):
        """会話リスト取得（高頻度）"""
        self.client.get("/api/conversations")

    @task(1)
    def create_message(self):
        """メッセージ作成（低頻度）"""
        self.client.post("/api/messages", json={
            "conversation_id": 1,
            "content": "テストメッセージ"
        })

    @task(1)
    def voice_transcription(self):
        """音声変換（低頻度・重い処理）"""
        with open("test_audio.wav", "rb") as f:
            self.client.post("/api/voice/transcribe",
                           files={"audio": f})
```

---

## 🚨 性能アラート・しきい値

### 監視項目としきい値

| 項目             | 警告しきい値 | 危険しきい値 | アクション       |
| ---------------- | ------------ | ------------ | ---------------- |
| **API 応答時間** | 500ms        | 1000ms       | 自動スケーリング |
| **エラー率**     | 1%           | 5%           | 緊急対応         |
| **CPU 使用率**   | 70%          | 90%          | スケールアップ   |
| **メモリ使用率** | 80%          | 95%          | メモリリーク調査 |
| **DB 接続数**    | 80%          | 95%          | 接続プール調整   |

### アラート通知設定

```yaml
# 監視設定例（将来的にHelm/Kubernetesで管理）
alerts:
  - name: high_response_time
    condition: avg_response_time > 500ms
    duration: 5m
    action: notify_slack

  - name: high_error_rate
    condition: error_rate > 1%
    duration: 2m
    action: notify_oncall
```

---

## 📈 継続的改善・最適化サイクル

### 1. 定期的な性能監査

- **週次**: Core Web Vitals レポート確認
- **月次**: API 性能・データベース性能レビュー
- **四半期**: 全体的な性能目標達成度評価

### 2. パフォーマンス改善プロセス

1. **問題の特定**: モニタリングデータから課題抽出
2. **原因分析**: プロファイリング・ログ分析
3. **改善案検討**: 技術的解決策の評価
4. **実装・テスト**: パフォーマンステスト実施
5. **デプロイ・監視**: 本番環境での効果測定

### 3. 技術債務管理

- **コードレビュー**: 性能に影響する変更の事前チェック
- **リファクタリング**: 定期的な性能改善
- **技術選択**: 新機能開発時の性能影響評価

---

## 🛠️ 開発時の性能考慮事項

### フロントエンド開発時のチェックリスト

- [ ] 大きな画像には next/image を使用
- [ ] 不要な JavaScript バンドルを避ける
- [ ] API コールは適切にキャッシュ
- [ ] コンポーネントの不要な再レンダリングを防ぐ
- [ ] Lazy Loading を適切に活用

### バックエンド開発時のチェックリスト

- [ ] データベースクエリに N+1 問題がない
- [ ] 適切なインデックスが設定されている
- [ ] 重い処理は非同期で実行
- [ ] レスポンスデータは必要最小限
- [ ] 適切なキャッシュ戦略を採用

### 音声機能開発時のチェックリスト

- [ ] 音声ファイルサイズ制限を実装
- [ ] タイムアウト処理を実装
- [ ] エラーハンドリングを適切に実装
- [ ] ユーザーへの処理状況フィードバック

---

**🎯 性能は機能の一部です。ユーザー体験を向上させるため、継続的に監視・改善していきましょう！**
