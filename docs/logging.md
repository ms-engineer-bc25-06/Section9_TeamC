# BUD - ログ設計・運用ガイド

BUD アプリケーションのログ管理方針、ログレベル、監査要件、分析手法を定義します。

## 🎯 ログ設計の目的・方針

### 基本方針

- **透明性**: システムの動作状況を可視化
- **追跡可能性**: 問題の原因を迅速に特定
- **監査対応**: セキュリティ・コンプライアンス要件を満たす
- **パフォーマンス**: ログ出力がシステム性能に与える影響を最小化
- **プライバシー保護**: 個人情報・音声データの適切な保護

### ログ分類

| ログ種別                 | 目的                 | 保存期間 | 重要度 |
| ------------------------ | -------------------- | -------- | ------ |
| **アプリケーションログ** | 業務処理の記録       | 6 か月   | 高     |
| **アクセスログ**         | API 呼び出し履歴     | 3 か月   | 中     |
| **エラーログ**           | システム障害・例外   | 1 年     | 高     |
| **監査ログ**             | セキュリティ関連操作 | 2 年     | 最高   |
| **パフォーマンスログ**   | 性能監視データ       | 1 か月   | 中     |
| **音声処理ログ**         | 音声機能利用履歴     | 3 か月   | 高     |

---

## 📊 ログレベル定義

### 標準ログレベル

| レベル    | 用途                       | 出力環境           | 例                                     |
| --------- | -------------------------- | ------------------ | -------------------------------------- |
| **ERROR** | システム障害・重大なエラー | 全環境             | データベース接続失敗、API 呼び出し失敗 |
| **WARN**  | 警告・潜在的な問題         | 全環境             | リトライ処理、レスポンス遅延           |
| **INFO**  | 重要な業務処理             | 全環境             | ユーザー登録、会話作成、音声変換完了   |
| **DEBUG** | 開発・デバッグ用詳細情報   | 開発・ステージング | 関数の引数・戻り値、SQL 実行内容       |
| **TRACE** | 最詳細レベル               | 開発のみ           | 詳細な処理フロー                       |

### 環境別ログレベル設定

```bash
# 本番環境
LOG_LEVEL=INFO

# ステージング環境
LOG_LEVEL=DEBUG

# 開発環境
LOG_LEVEL=TRACE
```

---

## 🖥️ フロントエンド ログ設計

### ログ実装例

#### 1. ログ基盤クラス

```typescript
// utils/logger.ts
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4,
}

export class Logger {
  private static level: LogLevel =
    process.env.NODE_ENV === "production" ? LogLevel.INFO : LogLevel.DEBUG;

  static error(message: string, error?: Error, context?: any): void {
    if (this.level >= LogLevel.ERROR) {
      const logData = this.createLogData("ERROR", message, error, context);
      console.error(logData);

      // 本番環境では外部サービスに送信
      if (process.env.NODE_ENV === "production") {
        this.sendToLoggingService(logData);
      }
    }
  }

  static warn(message: string, context?: any): void {
    if (this.level >= LogLevel.WARN) {
      const logData = this.createLogData("WARN", message, undefined, context);
      console.warn(logData);
    }
  }

  static info(message: string, context?: any): void {
    if (this.level >= LogLevel.INFO) {
      const logData = this.createLogData("INFO", message, undefined, context);
      console.info(logData);
    }
  }

  static debug(message: string, context?: any): void {
    if (this.level >= LogLevel.DEBUG) {
      const logData = this.createLogData("DEBUG", message, undefined, context);
      console.debug(logData);
    }
  }

  private static createLogData(
    level: string,
    message: string,
    error?: Error,
    context?: any
  ) {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
      context,
      url: typeof window !== "undefined" ? window.location.href : undefined,
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      sessionId: this.getSessionId(),
    };
  }

  private static getSessionId(): string {
    // セッションIDの取得（プライバシーに配慮）
    return sessionStorage.getItem("sessionId") || "anonymous";
  }

  private static async sendToLoggingService(logData: any): Promise<void> {
    try {
      await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(logData),
      });
    } catch (error) {
      // ログ送信失敗時のフォールバック
      console.error("Failed to send log to service:", error);
    }
  }
}
```

#### 2. 業務ログの実装例

```typescript
// components/VoiceRecorder.tsx
import { Logger } from "@/utils/logger";

export function VoiceRecorder() {
  const startRecording = async () => {
    try {
      Logger.info("音声録音開始", {
        feature: "voice_recording",
        action: "start",
      });

      // 音声録音処理
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.start();

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        Logger.info("音声認識完了", {
          feature: "voice_recognition",
          action: "completed",
          textLength: transcript.length,
          confidence: event.results[0][0].confidence,
        });
      };

      recognition.onerror = (event) => {
        Logger.error("音声認識エラー", new Error(event.error), {
          feature: "voice_recognition",
          errorType: event.error,
        });
      };
    } catch (error) {
      Logger.error("音声録音開始失敗", error as Error, {
        feature: "voice_recording",
      });
    }
  };
}
```

#### 3. API 呼び出しログ

```typescript
// utils/api-client.ts
import { Logger } from "@/utils/logger";

export class ApiClient {
  static async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const startTime = performance.now();
    const requestId = crypto.randomUUID();

    Logger.debug("API呼び出し開始", {
      requestId,
      method: options.method || "GET",
      url,
      timestamp: new Date().toISOString(),
    });

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
          ...options.headers,
        },
      });

      const duration = performance.now() - startTime;

      if (!response.ok) {
        Logger.warn("API呼び出し失敗", {
          requestId,
          url,
          status: response.status,
          statusText: response.statusText,
          duration: `${duration.toFixed(2)}ms`,
        });
        throw new Error(`API Error: ${response.status}`);
      }

      Logger.info("API呼び出し成功", {
        requestId,
        url,
        status: response.status,
        duration: `${duration.toFixed(2)}ms`,
      });

      return await response.json();
    } catch (error) {
      const duration = performance.now() - startTime;
      Logger.error("API呼び出しエラー", error as Error, {
        requestId,
        url,
        duration: `${duration.toFixed(2)}ms`,
      });
      throw error;
    }
  }
}
```

---

## ⚡ バックエンド ログ設計

### ログ実装例

#### 1. ログ設定（FastAPI）

```python
# utils/logger.py
import logging
import json
from datetime import datetime
from typing import Any, Dict, Optional
import uuid
from contextvars import ContextVar

# リクエストIDをコンテキストで管理
request_id_var: ContextVar[str] = ContextVar('request_id', default='')

class BudLogger:
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.INFO)

        # JSON形式でログ出力
        handler = logging.StreamHandler()
        formatter = JsonFormatter()
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)

    def _create_log_data(self, level: str, message: str, **kwargs) -> Dict[str, Any]:
        return {
            'timestamp': datetime.utcnow().isoformat(),
            'level': level,
            'message': message,
            'request_id': request_id_var.get(),
            'service': 'bud-backend',
            **kwargs
        }

    def info(self, message: str, **kwargs):
        log_data = self._create_log_data('INFO', message, **kwargs)
        self.logger.info(json.dumps(log_data, ensure_ascii=False))

    def error(self, message: str, error: Optional[Exception] = None, **kwargs):
        log_data = self._create_log_data('ERROR', message, **kwargs)
        if error:
            log_data['error'] = {
                'type': type(error).__name__,
                'message': str(error),
                'traceback': traceback.format_exc()
            }
        self.logger.error(json.dumps(log_data, ensure_ascii=False))

    def warn(self, message: str, **kwargs):
        log_data = self._create_log_data('WARN', message, **kwargs)
        self.logger.warning(json.dumps(log_data, ensure_ascii=False))

class JsonFormatter(logging.Formatter):
    def format(self, record):
        return record.getMessage()

# インスタンス作成
logger = BudLogger(__name__)
```

#### 2. ミドルウェアでのリクエストログ

```python
# middleware/logging_middleware.py
import time
import uuid
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from utils.logger import logger, request_id_var

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # リクエストID生成
        request_id = str(uuid.uuid4())
        request_id_var.set(request_id)

        start_time = time.time()

        # リクエスト開始ログ
        logger.info("リクエスト開始",
            method=request.method,
            url=str(request.url),
            client_ip=request.client.host,
            user_agent=request.headers.get("user-agent", ""),
            request_id=request_id
        )

        try:
            response = await call_next(request)

            # レスポンス時間計算
            process_time = time.time() - start_time

            # リクエスト完了ログ
            logger.info("リクエスト完了",
                method=request.method,
                url=str(request.url),
                status_code=response.status_code,
                process_time_ms=round(process_time * 1000, 2),
                request_id=request_id
            )

            # レスポンスヘッダーにリクエストIDを追加
            response.headers["X-Request-ID"] = request_id

            return response

        except Exception as e:
            process_time = time.time() - start_time

            logger.error("リクエスト処理エラー",
                error=e,
                method=request.method,
                url=str(request.url),
                process_time_ms=round(process_time * 1000, 2),
                request_id=request_id
            )
            raise
```

#### 3. 業務ロジックでのログ実装例

```python
# services/conversation_service.py
from utils.logger import logger
from models.conversation import Conversation

class ConversationService:
    def __init__(self, db: Session):
        self.db = db

    async def create_conversation(self, user_id: int, title: str) -> Conversation:
        logger.info("会話作成開始",
            user_id=user_id,
            title=title,
            action="conversation_create_start"
        )

        try:
            conversation = Conversation(
                user_id=user_id,
                title=title,
                created_at=datetime.utcnow()
            )

            self.db.add(conversation)
            self.db.commit()
            self.db.refresh(conversation)

            logger.info("会話作成完了",
                user_id=user_id,
                conversation_id=conversation.id,
                title=title,
                action="conversation_create_success"
            )

            return conversation

        except Exception as e:
            self.db.rollback()
            logger.error("会話作成失敗",
                error=e,
                user_id=user_id,
                title=title,
                action="conversation_create_error"
            )
            raise

    async def process_voice_message(self, conversation_id: int, audio_data: bytes) -> str:
        logger.info("音声メッセージ処理開始",
            conversation_id=conversation_id,
            audio_size_bytes=len(audio_data),
            action="voice_processing_start"
        )

        try:
            # 音声をテキストに変換
            text = await self._transcribe_audio(audio_data)

            logger.info("音声変換完了",
                conversation_id=conversation_id,
                text_length=len(text),
                action="voice_transcription_success"
            )

            # メッセージとして保存
            message = await self._save_message(conversation_id, text, "voice")

            logger.info("音声メッセージ保存完了",
                conversation_id=conversation_id,
                message_id=message.id,
                action="voice_message_saved"
            )

            return text

        except Exception as e:
            logger.error("音声メッセージ処理失敗",
                error=e,
                conversation_id=conversation_id,
                action="voice_processing_error"
            )
            raise
```

---

## 🔒 監査ログ設計

### セキュリティ関連操作の記録

#### 1. 認証・認可ログ

```python
# services/auth_service.py
from utils.logger import logger

class AuthService:
    async def login(self, email: str, password: str) -> Dict[str, Any]:
        logger.info("ログイン試行",
            email=email,
            action="login_attempt",
            audit=True  # 監査ログフラグ
        )

        try:
            # Firebase認証処理
            user = await self._authenticate_user(email, password)

            logger.info("ログイン成功",
                user_id=user.id,
                email=email,
                action="login_success",
                audit=True
            )

            return {"user": user, "token": "..."}

        except AuthenticationError as e:
            logger.warn("ログイン失敗",
                email=email,
                error_type="authentication_failed",
                action="login_failure",
                audit=True
            )
            raise

    async def logout(self, user_id: int):
        logger.info("ログアウト",
            user_id=user_id,
            action="logout",
            audit=True
        )
```

#### 2. データ操作監査ログ

```python
# services/message_service.py
class MessageService:
    async def delete_message(self, user_id: int, message_id: int):
        message = await self._get_message(message_id)

        # 削除前の監査ログ
        logger.info("メッセージ削除",
            user_id=user_id,
            message_id=message_id,
            conversation_id=message.conversation_id,
            message_content_length=len(message.content),
            action="message_delete",
            audit=True
        )

        await self._delete_message(message_id)

    async def update_message(self, user_id: int, message_id: int, new_content: str):
        old_message = await self._get_message(message_id)

        logger.info("メッセージ更新",
            user_id=user_id,
            message_id=message_id,
            old_content_length=len(old_message.content),
            new_content_length=len(new_content),
            action="message_update",
            audit=True
        )

        await self._update_message(message_id, new_content)
```

---

## 🎤 音声機能専用ログ

### 音声処理の詳細ログ

```python
# services/voice_service.py
class VoiceService:
    async def transcribe_audio(self, audio_data: bytes, user_id: int) -> str:
        audio_info = {
            'size_bytes': len(audio_data),
            'duration_estimate': self._estimate_duration(audio_data),
            'format': self._detect_audio_format(audio_data)
        }

        logger.info("音声変換開始",
            user_id=user_id,
            audio_info=audio_info,
            action="voice_transcription_start",
            feature="voice_processing"
        )

        try:
            # Web Speech API または Whisper API
            if self._use_web_speech_api():
                result = await self._transcribe_with_web_speech(audio_data)
                logger.info("Web Speech API 変換完了",
                    user_id=user_id,
                    result_length=len(result),
                    method="web_speech_api",
                    action="transcription_success"
                )
            else:
                result = await self._transcribe_with_whisper(audio_data)
                logger.info("Whisper API 変換完了",
                    user_id=user_id,
                    result_length=len(result),
                    method="whisper_api",
                    action="transcription_success"
                )

            # プライバシー保護：音声データは記録しない
            logger.info("音声変換結果",
                user_id=user_id,
                transcription_length=len(result),
                audio_duration=audio_info['duration_estimate'],
                quality_score=self._calculate_quality_score(result),
                action="transcription_completed"
            )

            return result

        except Exception as e:
            logger.error("音声変換エラー",
                error=e,
                user_id=user_id,
                audio_info=audio_info,
                action="transcription_error"
            )
            raise

    def _calculate_quality_score(self, text: str) -> float:
        # 変換品質の簡易評価
        if len(text) == 0:
            return 0.0

        # 文字数、句読点の有無などで品質評価
        score = min(1.0, len(text) / 100)  # 簡易実装
        return round(score, 2)
```

---

## 📈 ログ分析・監視

### 1. ログ集約・可視化

#### Elasticsearch + Kibana 風の設定例

```yaml
# docker-compose.yml (将来的な拡張用)
version: "3.8"
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.5.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"

  kibana:
    image: docker.elastic.co/kibana/kibana:8.5.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch

  logstash:
    image: docker.elastic.co/logstash/logstash:8.5.0
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline
    depends_on:
      - elasticsearch
```

#### ログ転送設定

```python
# utils/log_shipper.py
import asyncio
import aiohttp
from typing import Dict, Any

class LogShipper:
    def __init__(self, elasticsearch_url: str):
        self.elasticsearch_url = elasticsearch_url

    async def ship_log(self, log_data: Dict[str, Any]):
        """ログをElasticsearchに送信"""
        if not self._should_ship_log(log_data):
            return

        try:
            async with aiohttp.ClientSession() as session:
                await session.post(
                    f"{self.elasticsearch_url}/bud-logs/_doc",
                    json=log_data,
                    timeout=aiohttp.ClientTimeout(total=5)
                )
        except Exception as e:
            # ログ送信失敗時はローカルログに記録
            print(f"Failed to ship log: {e}")

    def _should_ship_log(self, log_data: Dict[str, Any]) -> bool:
        """送信すべきログかどうかを判定"""
        # 本番環境のみ、または重要度の高いログのみ送信
        return (
            log_data.get('level') in ['ERROR', 'WARN'] or
            log_data.get('audit') is True or
            log_data.get('feature') == 'voice_processing'
        )
```

### 2. アラート設定

#### 重要なログイベントの監視

```python
# utils/log_alerting.py
from typing import Dict, Any
import asyncio

class LogAlertManager:
    def __init__(self):
        self.alert_rules = [
            {
                'name': 'high_error_rate',
                'condition': lambda logs: self._check_error_rate(logs) > 0.05,
                'action': self._send_slack_alert
            },
            {
                'name': 'voice_processing_failure',
                'condition': lambda logs: self._check_voice_failures(logs) > 5,
                'action': self._send_urgent_alert
            }
        ]

    async def process_log(self, log_data: Dict[str, Any]):
        """ログを受信してアラート条件をチェック"""
        for rule in self.alert_rules:
            if await self._evaluate_rule(rule, log_data):
                await rule['action'](rule['name'], log_data)

    def _check_error_rate(self, recent_logs: list) -> float:
        if not recent_logs:
            return 0.0

        error_count = sum(1 for log in recent_logs if log.get('level') == 'ERROR')
        return error_count / len(recent_logs)

    async def _send_slack_alert(self, rule_name: str, log_data: Dict[str, Any]):
        # Slack通知の実装
        pass
```

---

## 🔧 ログローテーション・保存

### ログファイル管理

#### 1. ローテーション設定

```python
# utils/log_rotation.py
import logging.handlers
import os
from datetime import datetime

def setup_rotating_logger(name: str, log_file: str, max_bytes: int = 10485760, backup_count: int = 5):
    """ローテーション機能付きロガー設定"""

    # ログディレクトリ作成
    log_dir = os.path.dirname(log_file)
    os.makedirs(log_dir, exist_ok=True)

    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    # ローテーションハンドラー
    handler = logging.handlers.RotatingFileHandler(
        log_file,
        maxBytes=max_bytes,  # 10MB
        backupCount=backup_count
    )

    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    handler.setFormatter(formatter)

    logger.addHandler(handler)
    return logger

# 使用例
app_logger = setup_rotating_logger('bud.app', '/var/log/bud/app.log')
audit_logger = setup_rotating_logger('bud.audit', '/var/log/bud/audit.log')
```

#### 2. ログ保存期間管理

```python
# utils/log_cleanup.py
import os
import time
from datetime import datetime, timedelta

class LogCleanupManager:
    def __init__(self, log_directory: str):
        self.log_directory = log_directory
        self.retention_policies = {
            'app.log': timedelta(days=180),      # 6か月
            'audit.log': timedelta(days=730),    # 2年
            'error.log': timedelta(days=365),    # 1年
            'access.log': timedelta(days=90),    # 3か月
        }

    def cleanup_old_logs(self):
        """保存期間を過ぎたログファイルを削除"""
        for log_pattern, retention_period in self.retention_policies.items():
            cutoff_time = datetime.now() - retention_period

            for filename in os.listdir(self.log_directory):
                if log_pattern in filename:
                    file_path = os.path.join(self.log_directory, filename)
                    file_time = datetime.fromtimestamp(os.path.getmtime(file_path))

                    if file_time < cutoff_time:
                        os.remove(file_path)
                        print(f"Deleted old log file: {filename}")

# 定期実行設定（cron等で実行）
if __name__ == "__main__":
    cleanup_manager = LogCleanupManager('/var/log/bud')
    cleanup_manager.cleanup_old_logs()
```

---

## 🔍 ログ分析・トラブルシューティング

### 一般的な分析クエリ例

#### 1. エラー分析

```bash
# 過去1時間のエラーログを時系列で表示
grep "ERROR" /var/log/bud/app.log | grep "$(date -d '1 hour ago' '+%Y-%m-%d %H')"

# 特定のエラータイプの発生頻度
grep "voice_processing_error" /var/log/bud/app.log | wc -l

# ユーザー別エラー集計
grep "ERROR" /var/log/bud/app.log | jq -r '.user_id' | sort | uniq -c | sort -nr
```

#### 2. パフォーマンス分析

```bash
# レスポンス時間が長いAPIコール
grep "process_time_ms" /var/log/bud/app.log | jq 'select(.process_time_ms > 1000)'

# 音声処理の処理時間分析
grep "voice_transcription" /var/log/bud/app.log | jq '.process_time_ms' | sort -n
```

#### 3. セキュリティ監査

```bash
# ログイン失敗の監視
grep "login_failure" /var/log/bud/audit.log | tail -20

# 異常なアクセスパターンの検出
grep "request_id" /var/log/bud/access.log | jq -r '.client_ip' | sort | uniq -c | sort -nr | head -10
```

---

## 📋 ログ運用チェックリスト

### 開発時のチェック項目

- [ ] 適切なログレベルを設定している
- [ ] 個人情報・機密情報をログに出力していない
- [ ] エラーハンドリングでログ出力している
- [ ] 重要な業務処理でログ出力している
- [ ] ログメッセージが検索・分析しやすい形式

### 本番運用時のチェック項目

- [ ] ログローテーションが正常に動作している
- [ ] ディスク容量が逼迫していない
- [ ] 重要なアラートが適切に通知されている
- [ ] 監査ログが改ざんされていない
- [ ] バックアップが正常に取得されている

### セキュリティチェック項目

- [ ] ログファイルのアクセス権限が適切に設定されている
- [ ] 監査ログの完全性が保たれている
- [ ] ログの改ざん検知機能が動作している
- [ ] 機密情報の漏洩がログに含まれていない
- [ ] ログ転送時の暗号化が適切に設定されている

---

## 🚨 障害時のログ活用

### 障害調査の手順

#### 1. 初期調査

```bash
# 障害発生時刻周辺のエラーログを確認
grep "ERROR\|WARN" /var/log/bud/app.log | grep "2025-08-04 14:"

# 特定のリクエストIDで関連ログを追跡
grep "request_id:abc-123-def" /var/log/bud/*.log

# システムリソース使用状況の確認
grep "memory\|cpu\|disk" /var/log/bud/system.log
```

#### 2. 詳細分析

```python
# scripts/log_analyzer.py
import json
from datetime import datetime, timedelta
from collections import defaultdict

class LogAnalyzer:
    def __init__(self, log_file_path: str):
        self.log_file_path = log_file_path

    def analyze_error_timeline(self, start_time: datetime, end_time: datetime):
        """指定期間のエラー発生タイムラインを分析"""
        errors = []

        with open(self.log_file_path, 'r') as f:
            for line in f:
                try:
                    log_data = json.loads(line)
                    log_time = datetime.fromisoformat(log_data['timestamp'])

                    if (start_time <= log_time <= end_time and
                        log_data.get('level') == 'ERROR'):
                        errors.append(log_data)
                except:
                    continue

        # エラータイプ別集計
        error_types = defaultdict(int)
        for error in errors:
            error_type = error.get('error', {}).get('type', 'Unknown')
            error_types[error_type] += 1

        return {
            'total_errors': len(errors),
            'error_types': dict(error_types),
            'timeline': sorted(errors, key=lambda x: x['timestamp'])
        }

    def find_performance_bottlenecks(self, threshold_ms: int = 1000):
        """性能ボトルネックの特定"""
        slow_requests = []

        with open(self.log_file_path, 'r') as f:
            for line in f:
                try:
                    log_data = json.loads(line)
                    process_time = log_data.get('process_time_ms', 0)

                    if process_time > threshold_ms:
                        slow_requests.append({
                            'timestamp': log_data['timestamp'],
                            'url': log_data.get('url', ''),
                            'process_time_ms': process_time,
                            'request_id': log_data.get('request_id', '')
                        })
                except:
                    continue

        return sorted(slow_requests, key=lambda x: x['process_time_ms'], reverse=True)
```

### 緊急時の対応フロー

#### 1. アラート受信時の対応

```python
# utils/emergency_response.py
class EmergencyResponseManager:
    def __init__(self):
        self.response_procedures = {
            'high_error_rate': self._handle_high_error_rate,
            'system_down': self._handle_system_down,
            'security_breach': self._handle_security_breach,
            'voice_service_failure': self._handle_voice_service_failure
        }

    async def handle_alert(self, alert_type: str, alert_data: dict):
        """アラート種別に応じた対応を実行"""
        if alert_type in self.response_procedures:
            await self.response_procedures[alert_type](alert_data)
        else:
            await self._handle_unknown_alert(alert_type, alert_data)

    async def _handle_high_error_rate(self, alert_data: dict):
        """高エラー率の対応"""
        # 1. 現在のエラー状況を詳細分析
        # 2. 影響範囲の特定
        # 3. 緊急度の判定
        # 4. 関係者への通知
        pass

    async def _handle_voice_service_failure(self, alert_data: dict):
        """音声サービス障害の対応"""
        # 1. 音声処理キューの状況確認
        # 2. 外部API（Whisper）の状況確認
        # 3. Web Speech API へのフォールバック検討
        # 4. ユーザーへの影響通知
        pass
```

---

## 📊 ログメトリクス・KPI

### 監視すべきメトリクス

#### 1. システムヘルス指標

| メトリクス             | 目標値   | アラート条件 |
| ---------------------- | -------- | ------------ |
| **エラー率**           | < 0.1%   | > 1%         |
| **平均レスポンス時間** | < 200ms  | > 500ms      |
| **ログ出力量**         | < 1GB/日 | > 5GB/日     |
| **ディスク使用率**     | < 80%    | > 90%        |

#### 2. 機能別メトリクス

| 機能             | メトリクス   | 目標値  |
| ---------------- | ------------ | ------- |
| **音声認識**     | 成功率       | > 95%   |
| **音声認識**     | 平均処理時間 | < 2 秒  |
| **API 認証**     | 失敗率       | < 0.1%  |
| **データベース** | 接続エラー率 | < 0.01% |

#### 3. ビジネスメトリクス

```python
# utils/business_metrics.py
class BusinessMetricsCollector:
    def __init__(self, log_analyzer):
        self.log_analyzer = log_analyzer

    def calculate_daily_metrics(self, date: str) -> dict:
        """日次ビジネスメトリクスを算出"""
        return {
            'active_users': self._count_active_users(date),
            'conversations_created': self._count_conversations(date),
            'voice_messages_processed': self._count_voice_messages(date),
            'average_session_duration': self._calculate_session_duration(date),
            'feature_usage': self._analyze_feature_usage(date)
        }

    def _count_voice_messages(self, date: str) -> int:
        """音声メッセージ処理数をカウント"""
        count = 0
        with open(self.log_file_path, 'r') as f:
            for line in f:
                try:
                    log_data = json.loads(line)
                    if (log_data.get('action') == 'voice_transcription_success' and
                        log_data['timestamp'].startswith(date)):
                        count += 1
                except:
                    continue
        return count
```

---

## 🔐 プライバシー・GDPR 対応

### 個人情報の取り扱い

#### 1. ログでの個人情報保護

```python
# utils/privacy_filter.py
import re
from typing import Dict, Any

class PrivacyFilter:
    def __init__(self):
        self.patterns = {
            'email': re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'),
            'phone': re.compile(r'\b\d{3}-\d{3,4}-\d{4}\b'),
            'ip_address': re.compile(r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b')
        }

    def sanitize_log_data(self, log_data: Dict[str, Any]) -> Dict[str, Any]:
        """ログデータから個人情報を除去・マスク"""
        sanitized = log_data.copy()

        # メッセージ内容のマスク
        if 'message' in sanitized:
            sanitized['message'] = self._mask_sensitive_data(sanitized['message'])

        # エラーメッセージのマスク
        if 'error' in sanitized and 'message' in sanitized['error']:
            sanitized['error']['message'] = self._mask_sensitive_data(
                sanitized['error']['message']
            )

        # IPアドレスの部分マスク（最後のオクテットを隠す）
        if 'client_ip' in sanitized:
            sanitized['client_ip'] = self._mask_ip_address(sanitized['client_ip'])

        return sanitized

    def _mask_sensitive_data(self, text: str) -> str:
        """機密データをマスクする"""
        masked_text = text

        for pattern_name, pattern in self.patterns.items():
            if pattern_name == 'email':
                masked_text = pattern.sub('***@***.com', masked_text)
            elif pattern_name == 'phone':
                masked_text = pattern.sub('***-****-****', masked_text)

        return masked_text

    def _mask_ip_address(self, ip: str) -> str:
        """IPアドレスを部分的にマスク"""
        parts = ip.split('.')
        if len(parts) == 4:
            return f"{parts[0]}.{parts[1]}.{parts[2]}.***"
        return ip
```

#### 2. データ削除要求への対応

```python
# utils/data_deletion.py
class DataDeletionManager:
    def __init__(self, log_directory: str):
        self.log_directory = log_directory

    async def delete_user_logs(self, user_id: int):
        """特定ユーザーのログデータを削除"""
        log_files = self._get_all_log_files()

        for log_file in log_files:
            await self._remove_user_data_from_log(log_file, user_id)

    async def _remove_user_data_from_log(self, log_file: str, user_id: int):
        """ログファイルから特定ユーザーのデータを除去"""
        temp_file = f"{log_file}.temp"

        with open(log_file, 'r') as infile, open(temp_file, 'w') as outfile:
            for line in infile:
                try:
                    log_data = json.loads(line)
                    if log_data.get('user_id') != user_id:
                        outfile.write(line)
                except:
                    # JSON以外のログ行はそのまま保持
                    outfile.write(line)

        # ファイルを置換
        os.replace(temp_file, log_file)
```

---

## 🔧 開発・運用ガイドライン

### 開発者向けガイドライン

#### 1. ログ実装のベストプラクティス

```python
# ✅ 良い例
logger.info("ユーザー登録完了",
    user_id=user.id,
    registration_method="google_oauth",
    action="user_registration_success"
)

# ❌ 悪い例
logger.info(f"User {user.email} registered successfully")  # 個人情報を含む
print("Something happened")  # 構造化されていない
logger.debug("All user data: " + str(user_data))  # 過度な情報
```

#### 2. エラーログのガイドライン

```python
# ✅ 良い例
try:
    result = await external_api_call()
except ExternalAPIError as e:
    logger.error("外部API呼び出し失敗",
        error=e,
        api_endpoint="/api/voice/transcribe",
        retry_count=retry_count,
        action="external_api_error"
    )

# ❌ 悪い例
except Exception as e:
    logger.error("Error occurred")  # 情報不足
    logger.error(str(e))  # コンテキスト不足
```

### 運用チーム向けガイドライン

#### 1. 日常監視項目

- **毎日確認**: エラー率、レスポンス時間、ディスク使用量
- **週次確認**: ログローテーション状況、バックアップ完了
- **月次確認**: ログ保存期間の遵守、セキュリティログ監査

#### 2. 緊急時対応手順

1. **アラート受信時**: 5 分以内に初期対応開始
2. **影響範囲特定**: ログ分析による原因調査
3. **エスカレーション**: 重大障害時の関係者通知
4. **復旧作業**: ログによる復旧状況確認
5. **事後分析**: 障害の根本原因分析

---

## 📝 まとめ

### ログ設計の重要ポイント

1. **構造化ログ**: JSON 形式での統一的なログ出力
2. **プライバシー保護**: 個人情報・機密情報の適切な保護
3. **監査証跡**: セキュリティ関連操作の完全な記録
4. **性能考慮**: ログ出力がシステム性能に与える影響の最小化
5. **運用性**: 障害時の迅速な原因特定と対応

### 継続的改善

- **ログの有効性**: 定期的なログ出力内容の見直し
- **監視精度**: アラート条件の調整と false positive の削減
- **分析効率**: ログ分析ツールの活用と自動化
- **セキュリティ**: ログセキュリティの継続的な強化

**🎯 適切なログ設計により、システムの透明性と信頼性を向上させ、迅速な問題解決とサービス改善を実現しましょう！**
