# BUD - 可用性設計・運用ガイド

BUD アプリケーションの可用性要件、冗長化設計、障害対応、災害復旧計画を定義します。

## 🎯 可用性目標・SLA 定義

### サービスレベル目標（SLO）

| 指標                         | 目標値         | 測定期間 | 重要度 |
| ---------------------------- | -------------- | -------- | ------ |
| **稼働率 (Uptime)**          | 99.5%          | 月次     | 最高   |
| **レスポンス時間**           | 95%が 2 秒以内 | 日次     | 高     |
| **API 可用性**               | 99.9%          | 月次     | 最高   |
| **音声処理可用性**           | 99.0%          | 月次     | 高     |
| **データ復旧時間 (RTO)**     | < 4 時間       | 障害時   | 高     |
| **データ損失許容時間 (RPO)** | < 1 時間       | 障害時   | 最高   |

### SLA (Service Level Agreement)

```yaml
# サービスレベル合意
monthly_uptime:
  target: 99.5%
  penalty:
    - threshold: 99.0%
      action: "サービスクレジット 5%"
    - threshold: 98.0%
      action: "サービスクレジット 10%"

response_time:
  target: "95% of requests < 2s"
  measurement: "monthly average"

planned_maintenance:
  max_duration: "4 hours/month"
  notification_period: "48 hours advance"
  allowed_window: "02:00-06:00 JST"
```

---

## 🏗️ システムアーキテクチャ・冗長化

### インフラ構成設計

#### 1. マルチリージョン構成

```yaml
# infrastructure/regions.yml
regions:
  primary:
    name: "ap-northeast-1" # 東京
    services:
      - frontend (Next.js)
      - backend (FastAPI)
      - database (PostgreSQL Primary)
      - redis (Primary)

  secondary:
    name: "ap-southeast-1" # シンガポール
    services:
      - backend (FastAPI) - Read Replica
      - database (PostgreSQL Read Replica)
      - redis (Replica)

  backup:
    name: "us-west-2" # オレゴン
    services:
      - database (Backup)
      - file_storage (Backup)

availability_zones:
  primary_region:
    - ap-northeast-1a
    - ap-northeast-1c
    - ap-northeast-1d

  distribution_strategy: "multi-az"
  min_availability_zones: 2
```

#### 2. ロードバランサー設計

```yaml
# infrastructure/load-balancer.yml
load_balancer:
  type: "Application Load Balancer"
  distribution: "round_robin"
  health_checks:
    interval: 30s
    timeout: 5s
    healthy_threshold: 2
    unhealthy_threshold: 3
    path: "/health"

  targets:
    frontend:
      - instance_type: "t3.medium"
      - min_capacity: 2
      - max_capacity: 10
      - auto_scaling: true

    backend:
      - instance_type: "t3.large"
      - min_capacity: 2
      - max_capacity: 8
      - auto_scaling: true

auto_scaling:
  metrics:
    - name: "CPUUtilization"
      target: 70%
    - name: "RequestCountPerTarget"
      target: 1000

  scale_out_cooldown: 300s
  scale_in_cooldown: 300s
```

#### 3. データベース冗長化

```python
# config/database.py
import asyncio
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

class DatabaseCluster:
    def __init__(self):
        # プライマリデータベース（読み書き）
        self.primary_engine = create_async_engine(
            "postgresql+asyncpg://user:pass@primary-db:5432/bud",
            pool_size=20,
            max_overflow=30,
            pool_pre_ping=True,
            pool_recycle=3600
        )

        # リードレプリカ（読み取り専用）
        self.replica_engines = [
            create_async_engine(
                "postgresql+asyncpg://user:pass@replica1-db:5432/bud",
                pool_size=15,
                max_overflow=20,
                pool_pre_ping=True
            ),
            create_async_engine(
                "postgresql+asyncpg://user:pass@replica2-db:5432/bud",
                pool_size=15,
                max_overflow=20,
                pool_pre_ping=True
            )
        ]

        self.current_replica_index = 0

    async def get_write_session(self) -> AsyncSession:
        """書き込み用セッション（プライマリDB）"""
        async_session = sessionmaker(
            self.primary_engine,
            class_=AsyncSession,
            expire_on_commit=False
        )
        return async_session()

    async def get_read_session(self) -> AsyncSession:
        """読み取り用セッション（リードレプリカ）"""
        # ラウンドロビンでレプリカを選択
        replica_engine = await self._get_healthy_replica()

        async_session = sessionmaker(
            replica_engine,
            class_=AsyncSession,
            expire_on_commit=False
        )
        return async_session()

    async def _get_healthy_replica(self):
        """健全なリードレプリカを取得"""
        for i in range(len(self.replica_engines)):
            replica_index = (self.current_replica_index + i) % len(self.replica_engines)
            replica_engine = self.replica_engines[replica_index]

            try:
                # ヘルスチェック
                async with replica_engine.connect() as conn:
                    await conn.execute("SELECT 1")

                self.current_replica_index = replica_index
                return replica_engine

            except Exception as e:
                logger.warn(f"リードレプリカ{replica_index}が利用不可",
                    error=str(e),
                    action="replica_health_check_failed"
                )
                continue

        # 全レプリカが利用不可の場合はプライマリを使用
        logger.warn("全リードレプリカが利用不可、プライマリDBを使用",
            action="fallback_to_primary"
        )
        return self.primary_engine

# 依存性注入
db_cluster = DatabaseCluster()

# サービスでの使用例
class ConversationService:
    async def get_conversations(self, user_id: int):
        """読み取り専用操作（レプリカ使用）"""
        async with await db_cluster.get_read_session() as session:
            result = await session.execute(
                select(Conversation).where(Conversation.user_id == user_id)
            )
            return result.scalars().all()

    async def create_conversation(self, user_id: int, title: str):
        """書き込み操作（プライマリ使用）"""
        async with await db_cluster.get_write_session() as session:
            conversation = Conversation(user_id=user_id, title=title)
            session.add(conversation)
            await session.commit()
            return conversation
```

---

## 🔄 障害検知・自動復旧

### ヘルスチェック実装

#### 1. アプリケーションヘルスチェック

```python
# utils/health_check.py
from fastapi import FastAPI, HTTPException
from sqlalchemy import text
from datetime import datetime
from typing import Dict, Any
import asyncio
import httpx

class HealthChecker:
    def __init__(self, db_cluster, redis_client):
        self.db_cluster = db_cluster
        self.redis_client = redis_client
        self.external_services = {
            'openai': 'https://api.openai.com/v1/models',
            'firebase': 'https://firebase.googleapis.com/v1/projects'
        }

    async def comprehensive_health_check(self) -> Dict[str, Any]:
        """包括的なヘルスチェック"""
        checks = await asyncio.gather(
            self._check_database(),
            self._check_redis(),
            self._check_external_services(),
            self._check_file_system(),
            self._check_memory_usage(),
            return_exceptions=True
        )

        results = {
            'timestamp': datetime.utcnow().isoformat(),
            'overall_status': 'healthy',
            'checks': {
                'database': checks[0],
                'redis': checks[1],
                'external_services': checks[2],
                'file_system': checks[3],
                'memory': checks[4]
            }
        }

        # 全体のステータス判定
        if any(isinstance(check, Exception) or
               (isinstance(check, dict) and check.get('status') == 'unhealthy')
               for check in checks):
            results['overall_status'] = 'unhealthy'

        return results

    async def _check_database(self) -> Dict[str, Any]:
        """データベース接続確認"""
        try:
            start_time = asyncio.get_event_loop().time()

            # プライマリDB確認
            async with await self.db_cluster.get_write_session() as session:
                await session.execute(text("SELECT 1"))

            # リードレプリカ確認
            async with await self.db_cluster.get_read_session() as session:
                await session.execute(text("SELECT 1"))

            response_time = (asyncio.get_event_loop().time() - start_time) * 1000

            return {
                'status': 'healthy',
                'response_time_ms': round(response_time, 2),
                'primary_db': 'connected',
                'read_replica': 'connected'
            }

        except Exception as e:
            return {
                'status': 'unhealthy',
                'error': str(e),
                'primary_db': 'error',
                'read_replica': 'unknown'
            }

    async def _check_redis(self) -> Dict[str, Any]:
        """Redis接続確認"""
        try:
            start_time = asyncio.get_event_loop().time()

            # 書き込み・読み取りテスト
            test_key = f"health_check_{int(start_time)}"
            await self.redis_client.set(test_key, "ok", ex=60)
            result = await self.redis_client.get(test_key)
            await self.redis_client.delete(test_key)

            response_time = (asyncio.get_event_loop().time() - start_time) * 1000

            if result == "ok":
                return {
                    'status': 'healthy',
                    'response_time_ms': round(response_time, 2),
                    'read_write': 'ok'
                }
            else:
                return {
                    'status': 'unhealthy',
                    'error': 'Redis read/write test failed'
                }

        except Exception as e:
            return {
                'status': 'unhealthy',
                'error': str(e)
            }

    async def _check_external_services(self) -> Dict[str, Any]:
        """外部サービス接続確認"""
        results = {}

        async with httpx.AsyncClient(timeout=10.0) as client:
            for service_name, url in self.external_services.items():
                try:
                    start_time = asyncio.get_event_loop().time()
                    response = await client.get(url)
                    response_time = (asyncio.get_event_loop().time() - start_time) * 1000

                    results[service_name] = {
                        'status': 'healthy' if response.status_code < 500 else 'degraded',
                        'status_code': response.status_code,
                        'response_time_ms': round(response_time, 2)
                    }

                except Exception as e:
                    results[service_name] = {
                        'status': 'unhealthy',
                        'error': str(e)
                    }

        overall_status = 'healthy'
        if any(result['status'] == 'unhealthy' for result in results.values()):
            overall_status = 'degraded'

        return {
            'status': overall_status,
            'services': results
        }

# FastAPIエンドポイント
app = FastAPI()
health_checker = HealthChecker(db_cluster, redis_client)

@app.get("/health")
async def health_check():
    """簡易ヘルスチェック"""
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}

@app.get("/health/detailed")
async def detailed_health_check():
    """詳細ヘルスチェック"""
    result = await health_checker.comprehensive_health_check()

    if result['overall_status'] == 'unhealthy':
        raise HTTPException(status_code=503, detail=result)

    return result
```

#### 2. 自動復旧メカニズム

```python
# utils/auto_recovery.py
import asyncio
from enum import Enum
from datetime import datetime, timedelta
from typing import Dict, List, Callable

class FailureType(Enum):
    DATABASE_CONNECTION = "database_connection"
    REDIS_CONNECTION = "redis_connection"
    EXTERNAL_SERVICE = "external_service"
    HIGH_MEMORY_USAGE = "high_memory_usage"
    HIGH_CPU_USAGE = "high_cpu_usage"

class AutoRecoveryManager:
    def __init__(self):
        self.recovery_actions = {
            FailureType.DATABASE_CONNECTION: [
                self._restart_db_connections,
                self._switch_to_backup_db,
                self._enable_maintenance_mode
            ],
            FailureType.REDIS_CONNECTION: [
                self._restart_redis_connection,
                self._switch_to_backup_redis,
                self._disable_caching
            ],
            FailureType.HIGH_MEMORY_USAGE: [
                self._trigger_garbage_collection,
                self._restart_worker_processes,
                self._scale_out_instances
            ]
        }

        self.failure_history = []
        self.recovery_in_progress = set()

    async def handle_failure(self, failure_type: FailureType, context: Dict):
        """障害の自動復旧処理"""
        if failure_type in self.recovery_in_progress:
            logger.info(f"復旧処理実行中のためスキップ: {failure_type.value}")
            return

        self.recovery_in_progress.add(failure_type)

        try:
            # 障害履歴を記録
            failure_record = {
                'type': failure_type.value,
                'timestamp': datetime.utcnow(),
                'context': context,
                'recovery_attempts': []
            }

            logger.error("障害検知、自動復旧開始",
                failure_type=failure_type.value,
                context=context,
                action="auto_recovery_start"
            )

            # 復旧アクションを順次実行
            actions = self.recovery_actions.get(failure_type, [])

            for i, action in enumerate(actions):
                try:
                    logger.info(f"復旧アクション実行: {action.__name__}",
                        failure_type=failure_type.value,
                        action_index=i + 1,
                        total_actions=len(actions)
                    )

                    result = await action(context)

                    failure_record['recovery_attempts'].append({
                        'action': action.__name__,
                        'result': 'success',
                        'timestamp': datetime.utcnow()
                    })

                    # 復旧確認
                    if await self._verify_recovery(failure_type):
                        logger.info("自動復旧成功",
                            failure_type=failure_type.value,
                            successful_action=action.__name__,
                            action="auto_recovery_success"
                        )
                        break

                except Exception as e:
                    failure_record['recovery_attempts'].append({
                        'action': action.__name__,
                        'result': 'failed',
                        'error': str(e),
                        'timestamp': datetime.utcnow()
                    })

                    logger.error(f"復旧アクション失敗: {action.__name__}",
                        error=e,
                        failure_type=failure_type.value
                    )

                    # 次のアクションまで待機
                    await asyncio.sleep(30)

            else:
                # 全ての復旧アクションが失敗
                logger.error("自動復旧失敗、手動対応が必要",
                    failure_type=failure_type.value,
                    action="auto_recovery_failed"
                )

                await self._escalate_to_human(failure_type, failure_record)

            self.failure_history.append(failure_record)

        finally:
            self.recovery_in_progress.discard(failure_type)

    async def _restart_db_connections(self, context: Dict) -> bool:
        """データベース接続の再起動"""
        try:
            # 接続プールをクリア
            await db_cluster.primary_engine.dispose()
            for replica_engine in db_cluster.replica_engines:
                await replica_engine.dispose()

            # 新しい接続プールを作成
            await db_cluster._initialize_engines()

            return True
        except Exception as e:
            logger.error("DB接続再起動失敗", error=e)
            return False

    async def _switch_to_backup_db(self, context: Dict) -> bool:
        """バックアップDBへの切り替え"""
        try:
            # バックアップDBの健全性確認
            backup_engine = create_async_engine(
                os.getenv('BACKUP_DATABASE_URL')
            )

            async with backup_engine.connect() as conn:
                await conn.execute(text("SELECT 1"))

            # プライマリDBをバックアップに切り替え
            db_cluster.primary_engine = backup_engine

            logger.info("バックアップDBに切り替え完了",
                action="database_failover"
            )

            return True
        except Exception as e:
            logger.error("バックアップDB切り替え失敗", error=e)
            return False

    async def _verify_recovery(self, failure_type: FailureType) -> bool:
        """復旧確認"""
        try:
            if failure_type == FailureType.DATABASE_CONNECTION:
                async with await db_cluster.get_write_session() as session:
                    await session.execute(text("SELECT 1"))
                return True

            elif failure_type == FailureType.REDIS_CONNECTION:
                await redis_client.ping()
                return True

            # その他の確認処理...

        except Exception:
            return False

        return False

    async def _escalate_to_human(self, failure_type: FailureType, failure_record: Dict):
        """人間への緊急エスカレーション"""
        escalation_data = {
            'severity': 'CRITICAL',
            'failure_type': failure_type.value,
            'auto_recovery_failed': True,
            'failure_record': failure_record,
            'required_action': 'IMMEDIATE_MANUAL_INTERVENTION'
        }

        # 緊急通知の送信
        await self._send_emergency_notification(escalation_data)

        # メンテナンスモードの有効化
        await self._enable_maintenance_mode()
```

---

## 🔄 災害復旧・バックアップ

### バックアップ戦略

#### 1. データベースバックアップ

```python
# utils/backup_manager.py
import asyncio
import boto3
from datetime import datetime, timedelta
from typing import List, Dict

class BackupManager:
    def __init__(self):
        self.s3_client = boto3.client('s3')
        self.backup_bucket = os.getenv('BACKUP_S3_BUCKET')
        self.retention_policy = {
            'daily': 30,    # 30日間
            'weekly': 12,   # 12週間
            'monthly': 12   # 12ヶ月間
        }

    async def create_database_backup(self, backup_type: str = 'daily') -> str:
        """データベースのバックアップ作成"""
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        backup_filename = f"db_backup_{backup_type}_{timestamp}.sql"

        try:
            # pg_dumpを使用してバックアップ作成
            backup_command = [
                'pg_dump',
                '--host', os.getenv('DB_HOST'),
                '--port', os.getenv('DB_PORT', '5432'),
                '--username', os.getenv('DB_USER'),
                '--dbname', os.getenv('DB_NAME'),
                '--verbose',
                '--clean',
                '--no-owner',
                '--no-privileges',
                '--format=custom'
            ]

            # バックアップファイルをS3にアップロード
            process = await asyncio.create_subprocess_exec(
                *backup_command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            stdout, stderr = await process.communicate()

            if process.returncode == 0:
                # S3にアップロード
                s3_key = f"database/{backup_type}/{backup_filename}"

                self.s3_client.put_object(
                    Bucket=self.backup_bucket,
                    Key=s3_key,
                    Body=stdout,
                    StorageClass='STANDARD_IA',  # コスト最適化
                    ServerSideEncryption='AES256'
                )

                # バックアップメタデータを記録
                await self._record_backup_metadata({
                    'filename': backup_filename,
                    's3_key': s3_key,
                    'backup_type': backup_type,
                    'timestamp': datetime.utcnow(),
                    'size_bytes': len(stdout),
                    'status': 'completed'
                })

                logger.info("データベースバックアップ完了",
                    backup_type=backup_type,
                    filename=backup_filename,
                    size_mb=round(len(stdout) / 1024 / 1024, 2),
                    action="backup_completed"
                )

                return s3_key

            else:
                raise Exception(f"pg_dump failed: {stderr.decode()}")

        except Exception as e:
            logger.error("データベースバックアップ失敗",
                error=e,
                backup_type=backup_type,
                action="backup_failed"
            )
            raise

    async def restore_database(self, backup_s3_key: str) -> bool:
        """データベースの復元"""
        try:
            # S3からバックアップファイルを取得
            response = self.s3_client.get_object(
                Bucket=self.backup_bucket,
                Key=backup_s3_key
            )
            backup_data = response['Body'].read()

            # 復元前の確認
            confirmation = await self._confirm_restoration()
            if not confirmation:
                return False

            # pg_restoreを使用して復元
            restore_command = [
                'pg_restore',
                '--host', os.getenv('DB_HOST'),
                '--port', os.getenv('DB_PORT', '5432'),
                '--username', os.getenv('DB_USER'),
                '--dbname', os.getenv('DB_NAME'),
                '--verbose',
                '--clean',
                '--if-exists'
            ]

            process = await asyncio.create_subprocess_exec(
                *restore_command,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            stdout, stderr = await process.communicate(input=backup_data)

            if process.returncode == 0:
                logger.info("データベース復元完了",
                    backup_s3_key=backup_s3_key,
                    action="restore_completed"
                )
                return True
            else:
                raise Exception(f"pg_restore failed: {stderr.decode()}")

        except Exception as e:
            logger.error("データベース復元失敗",
                error=e,
                backup_s3_key=backup_s3_key,
                action="restore_failed"
            )
            return False

    async def cleanup_old_backups(self):
        """古いバックアップの削除"""
        for backup_type, retention_days in self.retention_policy.items():
            cutoff_date = datetime.utcnow() - timedelta(days=retention_days)

            # S3から古いバックアップファイルを取得
            response = self.s3_client.list_objects_v2(
                Bucket=self.backup_bucket,
                Prefix=f"database/{backup_type}/"
            )

            deleted_count = 0
            for obj in response.get('Contents', []):
                if obj['LastModified'].replace(tzinfo=None) < cutoff_date:
                    self.s3_client.delete_object(
                        Bucket=self.backup_bucket,
                        Key=obj['Key']
                    )
                    deleted_count += 1

            logger.info("古いバックアップ削除完了",
                backup_type=backup_type,
                deleted_count=deleted_count,
                retention_days=retention_days,
                action="backup_cleanup"
            )

# 定期バックアップのスケジューリング
async def schedule_backups():
    """バックアップのスケジューリング"""
    backup_manager = BackupManager()

    while True:
        now = datetime.utcnow()

        # 毎日午前2時にバックアップ
        if now.hour == 2 and now.minute == 0:
            await backup_manager.create_database_backup('daily')

            # 日曜日は週次バックアップも作成
            if now.weekday() == 6:
                await backup_manager.create_database_backup('weekly')

            # 月初は月次バックアップも作成
            if now.day == 1:
                await backup_manager.create_database_backup('monthly')

            # 古いバックアップの削除
            await backup_manager.cleanup_old_backups()

        # 1分間待機
        await asyncio.sleep(60)
```

#### 2. 災害復旧計画

```python
# utils/disaster_recovery.py
class DisasterRecoveryManager:
    def __init__(self):
        self.recovery_procedures = {
            'data_center_failure': self._handle_data_center_failure,
            'database_corruption': self._handle_database_corruption,
            'complete_system_failure': self._handle_complete_system_failure,
            'cyber_attack': self._handle_cyber_attack_recovery
        }

        self.rto_targets = {  # Recovery Time Objective
            'critical': timedelta(hours=1),
            'high': timedelta(hours=4),
            'medium': timedelta(hours=8),
            'low': timedelta(hours=24)
        }

        self.rpo_targets = {  # Recovery Point Objective
            'critical': timedelta(minutes=15),
            'high': timedelta(hours=1),
            'medium': timedelta(hours=4),
            'low': timedelta(hours=8)
        }

    async def initiate_disaster_recovery(
        self,
        disaster_type: str,
        severity: str,
        affected_components: List[str]
    ):
        """災害復旧プロセスの開始"""
        recovery_id = f"DR-{int(datetime.utcnow().timestamp())}"

        recovery_plan = {
            'recovery_id': recovery_id,
            'disaster_type': disaster_type,
            'severity': severity,
            'affected_components': affected_components,
            'start_time': datetime.utcnow(),
            'rto_target': self.rto_targets.get(severity),
            'rpo_target': self.rpo_targets.get(severity),
            'status': 'in_progress',
            'steps_completed': []
        }

        logger.critical("災害復旧プロセス開始",
            recovery_id=recovery_id,
            disaster_type=disaster_type,
            severity=severity,
            affected_components=affected_components,
            action="disaster_recovery_start"
        )

        try:
            # 災害タイプに応じた復旧手順を実行
            if disaster_type in self.recovery_procedures:
                await self.recovery_procedures[disaster_type](recovery_plan)
            else:
                await self._generic_recovery_procedure(recovery_plan)

            recovery_plan['status'] = 'completed'
            recovery_plan['end_time'] = datetime.utc
```
