# BUD - セキュリティ設計・対策ガイド

BUD アプリケーションのセキュリティ要件、脅威分析、対策実装、監査体制を定義します。

## 🛡️ セキュリティ基本方針

### 基本原則

- **最小権限の原則**: 必要最小限の権限のみを付与
- **多層防御**: 複数のセキュリティ層による防御
- **データ保護**: 個人情報・音声データの厳格な保護
- **透明性**: セキュリティ対策の可視化と監査
- **継続的改善**: 脅威の変化に応じた対策の更新

### セキュリティ目標

| 要素                         | 目標                           | 実装方針                 |
| ---------------------------- | ------------------------------ | ------------------------ |
| **機密性 (Confidentiality)** | 個人情報・音声データの漏洩防止 | 暗号化・アクセス制御     |
| **完全性 (Integrity)**       | データの改ざん・破損防止       | ハッシュ化・デジタル署名 |
| **可用性 (Availability)**    | サービスの継続的な提供         | 冗長化・DDoS 対策        |
| **認証 (Authentication)**    | 正当なユーザーの確認           | Firebase Auth・MFA       |
| **認可 (Authorization)**     | 適切な権限管理                 | RBAC・API 認可           |

---

## 🔐 認証・認可設計

### Firebase Authentication 実装

#### 1. 認証フロー設計

```typescript
// utils/auth.ts
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { auth } from "@/config/firebase";

export class AuthService {
  private static instance: AuthService;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async signInWithGoogle(): Promise<{ user: User; token: string }> {
    try {
      const provider = new GoogleAuthProvider();

      // セキュリティスコープを制限
      provider.addScope("email");
      provider.addScope("profile");

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // IDトークンを取得（JWTトークン）
      const token = await user.getIdToken();

      // ログイン履歴を記録（監査用）
      await this.logAuthEvent("login_success", {
        user_id: user.uid,
        email: user.email,
        method: "google_oauth",
        ip_address: await this.getClientIP(),
      });

      return { user, token };
    } catch (error) {
      await this.logAuthEvent("login_failure", {
        error: error.message,
        method: "google_oauth",
      });
      throw error;
    }
  }

  async signOut(): Promise<void> {
    const user = auth.currentUser;

    if (user) {
      await this.logAuthEvent("logout", {
        user_id: user.uid,
        email: user.email,
      });
    }

    await signOut(auth);

    // セッションストレージをクリア
    sessionStorage.clear();
  }

  // 認証状態の監視
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        // トークンの有効性を定期的にチェック
        this.scheduleTokenRefresh(user);
      }
      callback(user);
    });
  }

  private async scheduleTokenRefresh(user: User): Promise<void> {
    // トークンを50分ごとに更新（1時間で期限切れのため）
    setInterval(async () => {
      try {
        await user.getIdToken(true); // 強制更新
      } catch (error) {
        console.error("Token refresh failed:", error);
        await this.signOut(); // 失敗時は再ログインを促す
      }
    }, 50 * 60 * 1000);
  }

  private async logAuthEvent(event: string, data: any): Promise<void> {
    await fetch("/api/audit/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        ...data,
      }),
    });
  }

  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch("/api/client-ip");
      const data = await response.json();
      return data.ip;
    } catch {
      return "unknown";
    }
  }
}
```

#### 2. JWT トークン検証（バックエンド）

```python
# utils/auth_validator.py
import jwt
from firebase_admin import auth, credentials
from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from typing import Dict, Any, Optional

class FirebaseAuthValidator:
    def __init__(self):
        # Firebase Admin SDK初期化
        cred = credentials.Certificate("config/firebase-admin-sdk.json")
        firebase_admin.initialize_app(cred)

        self.security = HTTPBearer()

    async def verify_token(
        self,
        credentials: HTTPAuthorizationCredentials = Security(HTTPBearer())
    ) -> Dict[str, Any]:
        """Firebase IDトークンの検証"""

        if not credentials:
            raise HTTPException(
                status_code=403,
                detail='CSRF攻撃が検出されました'
            )

        return True

# フロントエンドでのCSRF対策
# utils/csrf-client.ts
export class CSRFClient {
  private static token: string | null = null;

  static async getToken(): Promise<string> {
    if (!this.token) {
      const response = await fetch('/api/csrf-token');
      const data = await response.json();
      this.token = data.token;
    }
    return this.token;
  }

  static async makeSecureRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const token = await this.getToken();

    return fetch(url, {
      ...options,
      headers: {
        'X-CSRF-Token': token,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
  }
}
```

---

## 🔐 セキュリティ監視・検知

### 異常検知システム

#### 1. 不正アクセス検知

```python
# utils/anomaly_detection.py
from datetime import datetime, timedelta
from collections import defaultdict
from typing import Dict, List, Any
import asyncio

class SecurityAnomalyDetector:
    def __init__(self):
        self.failed_logins = defaultdict(list)
        self.suspicious_ips = set()
        self.rate_violations = defaultdict(int)

    async def analyze_login_attempt(self, ip: str, email: str, success: bool):
        """ログイン試行の分析"""
        now = datetime.utcnow()

        if not success:
            # 失敗したログインを記録
            self.failed_logins[ip].append({
                'timestamp': now,
                'email': email
            })

            # 過去15分間の失敗回数をチェック
            recent_failures = [
                attempt for attempt in self.failed_logins[ip]
                if now - attempt['timestamp'] < timedelta(minutes=15)
            ]

            # 15分間で5回以上失敗 → ブルートフォース攻撃の可能性
            if len(recent_failures) >= 5:
                await self._handle_brute_force_attack(ip, recent_failures)

            # 複数の異なるメールアドレスで失敗 → アカウント列挙攻撃の可能性
            unique_emails = set([attempt['email'] for attempt in recent_failures])
            if len(unique_emails) >= 3:
                await self._handle_account_enumeration(ip, unique_emails)

    async def _handle_brute_force_attack(self, ip: str, attempts: List[Dict]):
        """ブルートフォース攻撃への対応"""
        self.suspicious_ips.add(ip)

        # 緊急アラート送信
        await self._send_security_alert(
            alert_type="brute_force_attack",
            details={
                'ip_address': ip,
                'attempt_count': len(attempts),
                'targeted_emails': [attempt['email'] for attempt in attempts],
                'time_window': '15分間'
            }
        )

        # IPアドレスを一時的にブロック
        await self._temporary_ip_block(ip, duration_minutes=60)

    async def _handle_account_enumeration(self, ip: str, emails: set):
        """アカウント列挙攻撃への対応"""
        await self._send_security_alert(
            alert_type="account_enumeration",
            details={
                'ip_address': ip,
                'targeted_emails': list(emails),
                'email_count': len(emails)
            }
        )

    async def detect_privilege_escalation(self, user_id: int, attempted_action: str):
        """権限昇格攻撃の検知"""
        user = await self._get_user(user_id)
        expected_permissions = self._get_user_permissions(user.role)

        if attempted_action not in expected_permissions:
            await self._send_security_alert(
                alert_type="privilege_escalation",
                details={
                    'user_id': user_id,
                    'user_role': user.role,
                    'attempted_action': attempted_action,
                    'allowed_actions': expected_permissions
                }
            )

    async def _send_security_alert(self, alert_type: str, details: Dict[str, Any]):
        """セキュリティアラートの送信"""
        alert_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'alert_type': alert_type,
            'severity': 'HIGH',
            'details': details
        }

        # ログ記録
        logger.error("セキュリティアラート",
            alert_type=alert_type,
            details=details,
            action="security_alert",
            security=True,
            audit=True
        )

        # Slack/メール通知（実装は環境に応じて）
        await self._notify_security_team(alert_data)

    async def _temporary_ip_block(self, ip: str, duration_minutes: int):
        """一時的なIPブロック"""
        # Redis等でIPブロックリストを管理
        await redis_client.setex(
            f"blocked_ip:{ip}",
            duration_minutes * 60,
            datetime.utcnow().isoformat()
        )

        logger.info("IPアドレス一時ブロック",
            ip_address=ip,
            duration_minutes=duration_minutes,
            action="ip_blocked",
            security=True
        )
```

#### 2. データ漏洩検知

```python
# utils/data_leak_detection.py
class DataLeakDetector:
    def __init__(self):
        self.sensitive_patterns = {
            'email': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            'phone': r'\b\d{3}-\d{3,4}-\d{4}\b',
            'credit_card': r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b'
        }

    async def scan_response_data(self, response_data: Any, user_id: int):
        """レスポンスデータの機密情報漏洩チェック"""
        if isinstance(response_data, dict):
            await self._scan_dict(response_data, user_id)
        elif isinstance(response_data, str):
            await self._scan_string(response_data, user_id)

    async def _scan_string(self, text: str, user_id: int):
        """文字列内の機密情報検知"""
        found_patterns = {}

        for pattern_name, pattern in self.sensitive_patterns.items():
            matches = re.findall(pattern, text)
            if matches:
                found_patterns[pattern_name] = len(matches)

        if found_patterns:
            await self._report_potential_leak(user_id, found_patterns, text[:100])

    async def _report_potential_leak(self, user_id: int, patterns: Dict, sample_text: str):
        """機密情報漏洩の可能性を報告"""
        logger.warn("機密情報漏洩の可能性",
            user_id=user_id,
            detected_patterns=patterns,
            sample_text=sample_text,
            action="potential_data_leak",
            security=True
        )
```

---

## 🔏 セキュリティテスト・監査

### セキュリティテスト実装

#### 1. 認証・認可テスト

```python
# tests/security/test_auth.py
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

class TestAuthentication:
    def test_protected_endpoint_without_token(self):
        """認証トークンなしでの保護されたエンドポイントアクセス"""
        response = client.get("/api/conversations")
        assert response.status_code == 401
        assert "認証トークンが必要" in response.json()["detail"]

    def test_invalid_token(self):
        """無効なトークンでのアクセス"""
        headers = {"Authorization": "Bearer invalid_token_here"}
        response = client.get("/api/conversations", headers=headers)
        assert response.status_code == 401
        assert "無効な認証トークン" in response.json()["detail"]

    def test_expired_token(self):
        """期限切れトークンでのアクセス"""
        expired_token = self._generate_expired_token()
        headers = {"Authorization": f"Bearer {expired_token}"}
        response = client.get("/api/conversations", headers=headers)
        assert response.status_code == 401

    def test_permission_denied(self):
        """権限不足でのアクセス"""
        child_token = self._generate_child_token()
        headers = {"Authorization": f"Bearer {child_token}"}

        # 子供が他の子供の会話にアクセス
        response = client.get("/api/conversations/999", headers=headers)
        assert response.status_code == 403
        assert "権限が不足" in response.json()["detail"]

class TestRateLimiting:
    def test_rate_limit_exceeded(self):
        """レート制限超過のテスト"""
        headers = {"Authorization": f"Bearer {self._get_valid_token()}"}

        # 制限回数以上のリクエストを送信
        for i in range(102):  # 制限は100回/分
            response = client.get("/api/conversations", headers=headers)

            if i < 100:
                assert response.status_code == 200
            else:
                assert response.status_code == 429
                assert "リクエスト回数が制限" in response.json()["detail"]

    def test_voice_rate_limit(self):
        """音声処理のレート制限テスト"""
        headers = {"Authorization": f"Bearer {self._get_valid_token()}"}
        audio_data = self._generate_dummy_audio()

        # 音声処理制限（10回/時間）を超過
        for i in range(12):
            response = client.post(
                "/api/voice/transcribe",
                headers=headers,
                files={"audio": audio_data}
            )

            if i < 10:
                assert response.status_code in [200, 202]
            else:
                assert response.status_code == 429
                assert "音声処理の利用制限" in response.json()["detail"]

class TestInputValidation:
    def test_sql_injection_attempts(self):
        """SQLインジェクション攻撃のテスト"""
        malicious_inputs = [
            "'; DROP TABLE users; --",
            "1' OR '1'='1",
            "UNION SELECT * FROM users",
        ]

        headers = {"Authorization": f"Bearer {self._get_valid_token()}"}

        for malicious_input in malicious_inputs:
            response = client.post(
                "/api/messages",
                headers=headers,
                json={
                    "conversation_id": malicious_input,
                    "content": "test message"
                }
            )

            # 不正な入力はバリデーションエラーになるべき
            assert response.status_code == 422

    def test_xss_payload_filtering(self):
        """XSS攻撃ペイロードのフィルタリング"""
        xss_payloads = [
            "<script>alert('XSS')</script>",
            "javascript:alert('XSS')",
            "<img src=x onerror=alert('XSS')>",
        ]

        headers = {"Authorization": f"Bearer {self._get_valid_token()}"}

        for payload in xss_payloads:
            response = client.post(
                "/api/messages",
                headers=headers,
                json={
                    "conversation_id": 1,
                    "content": payload
                }
            )

            if response.status_code == 200:
                # レスポンスにスクリプトタグが含まれていないことを確認
                assert "<script>" not in response.json()["content"]
                assert "javascript:" not in response.json()["content"]
```

#### 2. 脆弱性スキャン自動化

```yaml
# .github/workflows/security-scan.yml
name: Security Scan

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: "0 2 * * 1" # 毎週月曜日午前2時

jobs:
  dependency-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run dependency vulnerability scan
        run: |
          # Python依存関係の脆弱性チェック
          pip install safety
          safety check -r backend/requirements.txt

          # Node.js依存関係の脆弱性チェック
          cd frontend
          npm audit
          npm audit --audit-level high

  code-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run Bandit security scan
        run: |
          pip install bandit
          bandit -r backend/ -f json -o bandit-report.json

      - name: Run ESLint security rules
        run: |
          cd frontend
          npm install
          npm run lint:security

  container-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker images
        run: docker-compose build

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: "bud-backend:latest"
          format: "sarif"
          output: "trivy-results.sarif"
```

---

## 📋 セキュリティ運用・インシデント対応

### インシデント対応手順

#### 1. セキュリティインシデント分類

```python
# utils/incident_management.py
from enum import Enum
from datetime import datetime
from typing import Dict, List

class IncidentSeverity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class IncidentType(Enum):
    DATA_BREACH = "data_breach"
    UNAUTHORIZED_ACCESS = "unauthorized_access"
    MALWARE = "malware"
    DDOS_ATTACK = "ddos_attack"
    INSIDER_THREAT = "insider_threat"
    SYSTEM_COMPROMISE = "system_compromise"

class SecurityIncidentManager:
    def __init__(self):
        self.incident_procedures = {
            IncidentType.DATA_BREACH: self._handle_data_breach,
            IncidentType.UNAUTHORIZED_ACCESS: self._handle_unauthorized_access,
            IncidentType.DDOS_ATTACK: self._handle_ddos_attack,
        }

    async def create_incident(
        self,
        incident_type: IncidentType,
        severity: IncidentSeverity,
        description: str,
        affected_systems: List[str] = None,
        user_impact: str = None
    ) -> str:
        """セキュリティインシデントを作成"""
        incident_id = f"SEC-{int(datetime.utcnow().timestamp())}"

        incident_data = {
            'incident_id': incident_id,
            'type': incident_type.value,
            'severity': severity.value,
            'description': description,
            'affected_systems': affected_systems or [],
            'user_impact': user_impact,
            'created_at': datetime.utcnow(),
            'status': 'open',
            'assigned_to': None
        }

        # インシデント記録
        await self._store_incident(incident_data)

        # 重要度に応じた通知
        await self._notify_incident_team(incident_data)

        # 自動対応の実行
        if incident_type in self.incident_procedures:
            await self.incident_procedures[incident_type](incident_data)

        return incident_id

    async def _handle_data_breach(self, incident: Dict):
        """データ漏洩インシデントの対応"""
        steps = [
            "影響範囲の特定",
            "漏洩データの種類確認",
            "外部アクセスの遮断",
            "影響ユーザーへの通知準備",
            "法的要件の確認（GDPR等）"
        ]

        for step in steps:
            logger.info(f"データ漏洩対応: {step}",
                incident_id=incident['incident_id'],
                action="incident_response",
                security=True
            )

        # 緊急時の自動対応
        await self._emergency_system_lockdown()

    async def _handle_unauthorized_access(self, incident: Dict):
        """不正アクセスインシデントの対応"""
        # 不正アクセスしたアカウントの無効化
        if 'compromised_user_id' in incident:
            await self._disable_user_account(incident['compromised_user_id'])

        # セッションの強制終了
        await self._invalidate_all_sessions()

        # 認証ログの詳細分析
        await self._analyze_authentication_logs()

    async def _handle_ddos_attack(self, incident: Dict):
        """DDoS攻撃への対応"""
        # トラフィック分析
        attack_ips = await self._identify_attack_sources()

        # 攻撃IPの自動ブロック
        for ip in attack_ips:
            await self._block_ip_address(ip)

        # CDN/WAFの設定強化
        await self._enhance_traffic_filtering()
```

#### 2. 復旧・事後分析

```python
class IncidentRecovery:
    async def execute_recovery_plan(self, incident_id: str):
        """インシデント復旧計画の実行"""
        recovery_steps = [
            self._assess_system_integrity,
            self._restore_secure_configurations,
            self._verify_data_integrity,
            self._resume_normal_operations,
            self._conduct_post_incident_review
        ]

        for step in recovery_steps:
            try:
                await step(incident_id)
                logger.info(f"復旧ステップ完了: {step.__name__}",
                    incident_id=incident_id,
                    action="recovery_step",
                    security=True
                )
            except Exception as e:
                logger.error(f"復旧ステップ失敗: {step.__name__}",
                    incident_id=incident_id,
                    error=e,
                    action="recovery_error",
                    security=True
                )
                raise

    async def _conduct_post_incident_review(self, incident_id: str):
        """事後分析レポートの作成"""
        incident = await self._get_incident(incident_id)

        report = {
            'incident_summary': incident,
            'timeline': await self._build_incident_timeline(incident_id),
            'impact_analysis': await self._analyze_impact(incident_id),
            'lessons_learned': await self._extract_lessons(incident_id),
            'improvement_recommendations': await self._generate_recommendations(incident_id)
        }

        await self._generate_incident_report(report)
```

---

## 🔐 コンプライアンス・規制対応

### GDPR 対応

#### 1. データ処理記録

```python
# utils/gdpr_compliance.py
class GDPRComplianceManager:
    def __init__(self):
        self.data_processing_registry = []

    def register_data_processing(
        self,
        purpose: str,
        data_category: str,
        legal_basis: str,
        retention_period: str,
        data_subjects: str = "親・子"
    ):
        """データ処理活動の記録"""
        processing_record = {
            'id': str(uuid.uuid4()),
            'purpose': purpose,
            'data_category': data_category,
            'legal_basis': legal_basis,
            'retention_period': retention_period,
            'data_subjects': data_subjects,
            'created_at': datetime.utcnow(),
            'security_measures': self._get_security_measures(data_category)
        }

        self.data_processing_registry.append(processing_record)
        return processing_record['id']

    def _get_security_measures(self, data_category: str) -> List[str]:
        """データカテゴリに応じたセキュリティ対策"""
        measures = {
            'voice_data': [
                '音声データの暗号化',
                '処理後の即座削除',
                'アクセスログの記録',
                '最小権限アクセス'
            ],
            'personal_info': [
                'データベース暗号化',
                'アクセス制御',
                '監査ログ',
                'データ匿名化'
            ]
        }
        return measures.get(data_category, ['基本的なセキュリティ対策'])

    async def handle_data_subject_request(
        self,
        request_type: str,
        user_id: int,
        email: str
    ):
        """データ主体の権利要求への対応"""
        if request_type == 'access':
            return await self._provide_data_export(user_id)
        elif request_type == 'deletion':
            return await self._delete_user_data(user_id)
        elif request_type == 'portability':
            return await self._export_portable_data(user_id)
        elif request_type == 'rectification':
            return await self._facilitate_data_correction(user_id)

    async def _delete_user_data(self, user_id: int):
        """ユーザーデータの完全削除"""
        deletion_tasks = [
            self._delete_conversations(user_id),
            self._delete_messages(user_id),
            self._delete_voice_records(user_id),
            self._delete_audit_logs(user_id),
            self._delete_user_account(user_id)
        ]

        results = []
        for task in deletion_tasks:
            try:
                result = await task
                results.append({'task': task.__name__, 'status': 'success'})
            except Exception as e:
                results.append({'task': task.__name__, 'status': 'error', 'error': str(e)})

        # 削除証明書の発行
        certificate = await self._generate_deletion_certificate(user_id, results)

        return {
            'status': 'completed',
            'deletion_certificate': certificate,
            'tasks_completed': results
        }
```

---

## 📊 セキュリティメトリクス・KPI

### セキュリティ指標の監視

#### 1. セキュリティダッシュボード

```python
# utils/security_metrics.py
class SecurityMetricsCollector:
    def __init__(self):
        self.metrics = {}

    async def collect_daily_metrics(self) -> Dict[str, Any]:
        """日次セキュリティメトリクスの収集"""
        today = datetime.utcnow().date()

        metrics = {
            'authentication': await self._collect_auth_metrics(today),
            'threats': await self._collect_threat_metrics(today),
            'vulnerabilities': await self._collect_vulnerability_metrics(today),
            'compliance': await self._collect_compliance_metrics(today)
        }

        return metrics

    async def _collect_auth_metrics(self, date) -> Dict[str, int]:
        """認証関連メトリクス"""
        return {
            'successful_logins': await self._count_successful_logins(date),
            'failed_logins': await self._count_failed_logins(date),
            'account_lockouts': await self._count_account_lockouts(date),
            'password_resets': await self._count_password_resets(date),
            'mfa_usage': await self._count_mfa_usage(date)
        }

    async def _collect_threat_metrics(self, date) -> Dict[str, int]:
        """脅威検知メトリクス"""
        return {
            'blocked_ips': len(await self._get_blocked_ips(date)),
            'rate_limit_violations': await self._count_rate_violations(date),
            'suspicious_activities': await self._count_suspicious_activities(date),
            'security_alerts': await self._count_security_alerts(date)
        }

# セキュリティKPIの定義
SECURITY_KPIS = {
    'authentication_success_rate': {
        'target': 0.95,  # 95%以上
        'calculation': lambda metrics: metrics['successful_logins'] / (metrics['successful_logins'] + metrics['failed_logins'])
    },
    'incident_response_time': {
        'target': 30,  # 30分以内
        'unit': 'minutes'
    },
    'vulnerability_patch_time': {
        'target': 72,  # 72時間以内
        'unit': 'hours'
    },
    'security_training_completion': {
        'target': 1.0,  # 100%
        'calculation': lambda data: data['completed_users'] / data['total_users']
    }
}
```

---

## 🛠️ セキュリティ設定・チェックリスト

### 開発環境セキュリティ

#### 1. 開発時チェックリスト

- [ ] 環境変数で機密情報を管理（`.env`ファイル）
- [ ] API キーをハードコードしていない
- [ ] デバッグモードを本番環境で無効化
- [ ] セキュリティヘッダーが適切に設定されている
- [ ] HTTPS 通信が強制されている（本番環境）
- [ ] 入力値検証が実装されている
- [ ] SQL クエリがパラメータ化されている
- [ ] ファイルアップロードに制限がある

#### 2. 本番環境セキュリティ

- [ ] WAF（Web Application Firewall）が設定されている
- [ ] DDoS 対策が実装されている
- [ ] 侵入検知システム（IDS）が動作している
- [ ] ログ監視・アラート設定が完了している
- [ ] 定期的なセキュリティスキャンが実行されている
- [ ] バックアップデータが暗号化されている
- [ ] ネットワークセグメンテーションが実装されている
- [ ] 最小権限の原則が適用されている

#### 3. 監査・コンプライアンス

- [ ] 監査ログが改ざん不可能な形で保存されている
- [ ] データ処理活動が文書化されている
- [ ] プライバシーポリシーが最新である
- [ ] セキュリティインシデント対応計画が策定されている
- [ ] 定期的なペネトレーションテストが実施されている
- [ ] 従業員向けセキュリティ研修が実施されている

---

## 🚨 緊急対応・連絡体制

### 緊急連絡先

#### セキュリティインシデント発生時

1. **即座に対応**: システム管理者・開発リーダー
2. **30 分以内**: プロジェクトマネージャー・ステークホルダー
3. **2 時間以内**: 法務・広報（必要に応じて）
4. **24 時間以内**: 影響を受けるユーザーへの通知

#### エスカレーション基準

- **Critical**: サービス停止、データ漏洩、大規模な不正アクセス
- **High**: 機能障害、小規模な不正アクセス、セキュリティ脆弱性
- **Medium**: 性能劣化、設定不備、軽微なセキュリティ問題

---

## 📝 まとめ

### セキュリティ設計の重要ポイント

1. **多層防御**: 認証・認可・暗号化・監視の組み合わせ
2. **プライバシー保護**: 音声データ・個人情報の適切な取り扱い
3. **継続的監視**: リアルタイムでの脅威検知と対応
4. **インシデント対応**: 迅速な検知・対応・復旧体制
5. **コンプライアンス**: GDPR 等の規制要件への準拠

### 継続的改善

- **脅威情報**: 最新のセキュリティ脅威情報の収集
- **脆弱性管理**: 定期的な脆弱性スキャンとパッチ適用
- **教育・訓練**: チームメンバーのセキュリティ意識向上
- **監査**: 定期的なセキュリティ監査と改善実施

**🛡️ セキュリティは継続的なプロセスです。常に最新の脅威に対応し、ユーザーの信頼を守り続けましょう！**
status_code=401,
detail="認証トークンが必要です"
)

        try:
            # Firebase Admin SDKでトークン検証
            decoded_token = auth.verify_id_token(credentials.credentials)

            # トークンの有効性確認
            if not decoded_token.get('email_verified', False):
                raise HTTPException(
                    status_code=401,
                    detail="メールアドレスが未確認です"
                )

            # 監査ログ記録
            await self._log_token_verification(decoded_token, success=True)

            return {
                'user_id': decoded_token['uid'],
                'email': decoded_token['email'],
                'name': decoded_token.get('name'),
                'verified': decoded_token.get('email_verified', False)
            }

        except auth.InvalidIdTokenError as e:
            await self._log_token_verification(None, success=False, error=str(e))
            raise HTTPException(
                status_code=401,
                detail="無効な認証トークンです"
            )
        except Exception as e:
            await self._log_token_verification(None, success=False, error=str(e))
            raise HTTPException(
                status_code=500,
                detail="認証処理でエラーが発生しました"
            )

    async def _log_token_verification(
        self,
        token_data: Optional[Dict],
        success: bool,
        error: Optional[str] = None
    ):
        """トークン検証の監査ログ"""
        from utils.logger import logger

        logger.info("トークン検証",
            user_id=token_data.get('uid') if token_data else None,
            success=success,
            error=error,
            action="token_verification",
            audit=True
        )

# 依存性注入用のインスタンス

auth_validator = FirebaseAuthValidator()

# API エンドポイントでの使用例

@app.get("/api/protected")
async def protected_endpoint(
current_user: Dict[str, Any] = Depends(auth_validator.verify_token)
):
return {"message": f"Hello, {current_user['email']}"}

````

### 権限・認可制御

#### 1. ロールベースアクセス制御（RBAC）
```python
# models/user_role.py
from enum import Enum
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class UserRole(Enum):
    PARENT = "parent"
    CHILD = "child"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    firebase_uid = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    role = Column(String, nullable=False, default=UserRole.PARENT.value)
    parent_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # 関係性
    children = relationship("User", backref="parent", remote_side=[id])
    conversations = relationship("Conversation", back_populates="user")

# services/permission_service.py
from typing import List, Dict, Any
from models.user_role import User, UserRole

class PermissionService:
    def __init__(self):
        self.permissions = {
            UserRole.PARENT: [
                'conversation:create',
                'conversation:read_own',
                'conversation:read_children',
                'conversation:delete_own',
                'message:create',
                'message:read_own',
                'message:read_children',
                'voice:transcribe',
                'user:manage_children'
            ],
            UserRole.CHILD: [
                'conversation:create',
                'conversation:read_own',
                'message:create',
                'message:read_own',
                'voice:transcribe'
            ],
            UserRole.ADMIN: [
                'conversation:read_all',
                'user:manage_all',
                'system:monitor',
                'audit:read'
            ]
        }

    def check_permission(self, user: User, permission: str) -> bool:
        """ユーザーの権限チェック"""
        user_role = UserRole(user.role)
        return permission in self.permissions.get(user_role, [])

    def check_resource_access(self, user: User, resource_type: str, resource: Any) -> bool:
        """リソースへのアクセス権限チェック"""
        if user.role == UserRole.ADMIN.value:
            return True

        if resource_type == 'conversation':
            # 自分の会話または子供の会話にのみアクセス可能
            if resource.user_id == user.id:
                return True

            if user.role == UserRole.PARENT.value:
                # 親は子供の会話にアクセス可能
                child_ids = [child.id for child in user.children]
                return resource.user_id in child_ids

        return False

# デコレータでの権限チェック実装
from functools import wraps
from fastapi import HTTPException

def require_permission(permission: str):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            current_user = kwargs.get('current_user')
            if not current_user:
                raise HTTPException(status_code=401, detail="認証が必要です")

            permission_service = PermissionService()
            if not permission_service.check_permission(current_user, permission):
                raise HTTPException(status_code=403, detail="権限が不足しています")

            return await func(*args, **kwargs)
        return wrapper
    return decorator

# 使用例
@app.post("/api/conversations")
@require_permission('conversation:create')
async def create_conversation(
    conversation_data: ConversationCreate,
    current_user: Dict[str, Any] = Depends(auth_validator.verify_token)
):
    # 会話作成処理
    pass
````

---

## 🔒 データ保護・暗号化

### 音声データの保護

#### 1. 音声データ暗号化

```python
# utils/audio_encryption.py
import os
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from typing import bytes

class AudioEncryption:
    def __init__(self):
        self.salt = os.environ.get('AUDIO_ENCRYPTION_SALT', '').encode()
        if not self.salt:
            raise ValueError("音声暗号化用のソルトが設定されていません")

        # 暗号化キーの生成
        password = os.environ.get('AUDIO_ENCRYPTION_KEY', '').encode()
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=self.salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password))
        self.cipher_suite = Fernet(key)

    def encrypt_audio_data(self, audio_data: bytes) -> str:
        """音声データを暗号化してBase64エンコード"""
        try:
            encrypted_data = self.cipher_suite.encrypt(audio_data)
            return base64.b64encode(encrypted_data).decode('utf-8')
        except Exception as e:
            raise ValueError(f"音声データの暗号化に失敗: {str(e)}")

    def decrypt_audio_data(self, encrypted_data: str) -> bytes:
        """暗号化された音声データを復号化"""
        try:
            encrypted_bytes = base64.b64decode(encrypted_data.encode('utf-8'))
            return self.cipher_suite.decrypt(encrypted_bytes)
        except Exception as e:
            raise ValueError(f"音声データの復号化に失敗: {str(e)}")

# services/voice_service.py
class VoiceService:
    def __init__(self):
        self.audio_encryption = AudioEncryption()

    async def process_voice_safely(self, audio_data: bytes, user_id: int) -> str:
        """音声データを安全に処理"""

        # 1. 音声データのサイズ制限チェック
        if len(audio_data) > 25 * 1024 * 1024:  # 25MB制限
            raise ValueError("音声ファイルサイズが制限を超えています")

        # 2. 音声データの暗号化
        encrypted_audio = self.audio_encryption.encrypt_audio_data(audio_data)

        # 3. 一時的に暗号化データを保存（処理中のみ）
        temp_id = await self._store_temp_encrypted_audio(encrypted_audio, user_id)

        try:
            # 4. 復号化して音声処理実行
            decrypted_audio = self.audio_encryption.decrypt_audio_data(encrypted_audio)
            transcript = await self._transcribe_audio(decrypted_audio)

            # 5. 処理完了後、暗号化された音声データを削除
            await self._delete_temp_audio(temp_id)

            # 6. テキスト結果のみを返す（音声データは保持しない）
            return transcript

        except Exception as e:
            # エラー時も音声データを確実に削除
            await self._delete_temp_audio(temp_id)
            raise

    async def _store_temp_encrypted_audio(self, encrypted_data: str, user_id: int) -> str:
        """一時的な暗号化音声データの保存"""
        import uuid
        temp_id = str(uuid.uuid4())

        # Redis等の一時ストレージに保存（TTL設定）
        await redis_client.setex(
            f"temp_audio:{temp_id}",
            300,  # 5分で自動削除
            encrypted_data
        )

        # 監査ログ
        logger.info("一時音声データ保存",
            temp_id=temp_id,
            user_id=user_id,
            action="temp_audio_stored",
            audit=True
        )

        return temp_id

    async def _delete_temp_audio(self, temp_id: str):
        """一時音声データの削除"""
        await redis_client.delete(f"temp_audio:{temp_id}")

        logger.info("一時音声データ削除",
            temp_id=temp_id,
            action="temp_audio_deleted",
            audit=True
        )
```

#### 2. データベース暗号化

```python
# utils/db_encryption.py
from sqlalchemy_utils import EncryptedType
from sqlalchemy_utils.types.encrypted.encrypted_type import AesEngine
from sqlalchemy import Column, Integer, String, Text
from database import Base

# 暗号化カラムの実装
class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"))

    # メッセージ内容を暗号化して保存
    content = Column(EncryptedType(Text, secret_key, AesEngine, 'pkcs5'))

    # 検索用のハッシュ値（暗号化されたデータは検索できないため）
    content_hash = Column(String(64))  # SHA-256ハッシュ

    created_at = Column(DateTime, default=datetime.utcnow)

# services/message_service.py
import hashlib

class MessageService:
    def create_message(self, conversation_id: int, content: str) -> Message:
        # メッセージのハッシュ値を計算（検索用）
        content_hash = hashlib.sha256(content.encode()).hexdigest()

        message = Message(
            conversation_id=conversation_id,
            content=content,  # 自動的に暗号化される
            content_hash=content_hash
        )

        db.add(message)
        db.commit()

        return message
```

---

## 🛠️ API セキュリティ

### HTTPS・TLS 設定

#### 1. SSL/TLS 設定

```python
# main.py（FastAPI）
from fastapi import FastAPI
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware

app = FastAPI()

# 本番環境でのHTTPS強制
if os.getenv("ENVIRONMENT") == "production":
    app.add_middleware(HTTPSRedirectMiddleware)
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["bud-app.com", "*.bud-app.com"]
    )

# セキュリティヘッダーの設定
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)

    # セキュリティヘッダーを追加
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "connect-src 'self' https://api.openai.com https://firebase.googleapis.com"
    )

    return response
```

#### 2. CORS 設定

```python
# cors_config.py
from fastapi.middleware.cors import CORSMiddleware

def setup_cors(app: FastAPI):
    origins = []

    if os.getenv("ENVIRONMENT") == "development":
        origins = [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
    elif os.getenv("ENVIRONMENT") == "production":
        origins = [
            "https://bud-app.com",
            "https://www.bud-app.com"
        ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID"]
    )
```

### レート制限・DDoS 対策

#### 1. API レート制限

```python
# middleware/rate_limiting.py
import time
from collections import defaultdict
from fastapi import HTTPException, Request
from starlette.middleware.base import BaseHTTPMiddleware

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, calls: int = 100, period: int = 60):
        super().__init__(app)
        self.calls = calls  # 制限回数
        self.period = period  # 制限期間（秒）
        self.requests = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host
        now = time.time()

        # 古いリクエスト記録を削除
        self.requests[client_ip] = [
            req_time for req_time in self.requests[client_ip]
            if now - req_time < self.period
        ]

        # レート制限チェック
        if len(self.requests[client_ip]) >= self.calls:
            # 制限超過ログ
            logger.warn("レート制限超過",
                client_ip=client_ip,
                request_count=len(self.requests[client_ip]),
                path=request.url.path,
                action="rate_limit_exceeded",
                security=True
            )

            raise HTTPException(
                status_code=429,
                detail="リクエスト回数が制限を超えています"
            )

        # リクエスト記録
        self.requests[client_ip].append(now)

        response = await call_next(request)

        # レート制限情報をヘッダーに追加
        remaining = self.calls - len(self.requests[client_ip])
        response.headers["X-Rate-Limit-Limit"] = str(self.calls)
        response.headers["X-Rate-Limit-Remaining"] = str(remaining)

        return response

# 音声処理専用のレート制限
class VoiceRateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.voice_requests = defaultdict(list)
        self.voice_limit = 10  # 10回/時間
        self.voice_period = 3600  # 1時間

    async def dispatch(self, request: Request, call_next):
        # 音声関連エンドポイントのみ制限
        if "/api/voice" not in request.url.path:
            return await call_next(request)

        client_ip = request.client.host
        now = time.time()

        # 音声処理の制限チェック
        self.voice_requests[client_ip] = [
            req_time for req_time in self.voice_requests[client_ip]
            if now - req_time < self.voice_period
        ]

        if len(self.voice_requests[client_ip]) >= self.voice_limit:
            logger.warn("音声処理レート制限超過",
                client_ip=client_ip,
                request_count=len(self.voice_requests[client_ip]),
                action="voice_rate_limit_exceeded",
                security=True
            )

            raise HTTPException(
                status_code=429,
                detail="音声処理の利用制限に達しました。1時間後に再試行してください。"
            )

        self.voice_requests[client_ip].append(now)
        return await call_next(request)
```

---

## 🔍 脅威分析・対策

### OWASP Top 10 対策

#### 1. インジェクション攻撃対策

```python
# utils/input_validation.py
import re
from typing import Any, Dict
from pydantic import BaseModel, validator

class MessageCreate(BaseModel):
    content: str
    conversation_id: int

    @validator('content')
    def validate_content(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('メッセージ内容は必須です')

        if len(v) > 5000:
            raise ValueError('メッセージは5000文字以内で入力してください')

        # 危険なHTMLタグ・スクリプトを除去
        v = re.sub(r'<script[^>]*>.*?</script>', '', v, flags=re.IGNORECASE | re.DOTALL)
        v = re.sub(r'<[^>]+>', '', v)  # HTMLタグを除去

        return v.strip()

    @validator('conversation_id')
    def validate_conversation_id(cls, v):
        if v <= 0:
            raise ValueError('不正な会話IDです')
        return v

# SQLインジェクション対策（SQLAlchemy使用）
def get_user_conversations_safe(db: Session, user_id: int) -> List[Conversation]:
    """パラメータ化クエリでSQLインジェクション対策"""
    return db.query(Conversation)\
             .filter(Conversation.user_id == user_id)\
             .order_by(Conversation.created_at.desc())\
             .all()

# NoSQLインジェクション対策も考慮
def sanitize_query_params(params: Dict[str, Any]) -> Dict[str, Any]:
    """クエリパラメータのサニタイズ"""
    sanitized = {}

    for key, value in params.items():
        if isinstance(value, str):
            # 危険な文字列パターンを除去
            value = re.sub(r'[{}$\[\]]', '', value)
        sanitized[key] = value

    return sanitized
```

#### 2. XSS (Cross-Site Scripting) 対策

```typescript
// utils/xss-protection.ts
import DOMPurify from "dompurify";

export class XSSProtection {
  /**
   * ユーザー入力をサニタイズ
   */
  static sanitizeInput(input: string): string {
    if (!input) return "";

    // HTMLタグを無害化
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [], // HTMLタグを一切許可しない
      ALLOWED_ATTR: [],
    });
  }

  /**
   * HTMLとして表示する場合の安全なサニタイズ
   */
  static sanitizeHtml(html: string): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br"],
      ALLOWED_ATTR: [],
    });
  }

  /**
   * URLの検証とサニタイズ
   */
  static sanitizeUrl(url: string): string {
    const allowedProtocols = ["http:", "https:", "mailto:"];

    try {
      const urlObj = new URL(url);
      if (!allowedProtocols.includes(urlObj.protocol)) {
        return "about:blank";
      }
      return url;
    } catch {
      return "about:blank";
    }
  }
}

// React コンポーネントでの使用例
export function MessageDisplay({ message }: { message: string }) {
  const safeMessage = XSSProtection.sanitizeInput(message);

  return <div className="message">{safeMessage}</div>;
}
```

#### 3. CSRF (Cross-Site Request Forgery) 対策

```python
# middleware/csrf_protection.py
import secrets
from fastapi import HTTPException, Request, Depends
from fastapi.security import HTTPBearer

class CSRFProtection:
    def __init__(self):
        self.security = HTTPBearer()

    def generate_csrf_token(self) -> str:
        """CSRFトークンを生成"""
        return secrets.token_urlsafe(32)

    async def verify_csrf_token(self, request: Request) -> bool:
        """CSRFトークンを検証"""
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True  # 読み取り専用メソッドは検証不要

        # ヘッダーからCSRFトークンを取得
        csrf_token = request.headers.get('X-CSRF-Token')
        if not csrf_token:
            raise HTTPException(
                status_code=403,
                detail='CSRFトークンが必要です'
            )

        # セッションからトークンを取得して比較
        session_token = request.session.get('csrf_token')
        if not session_token or csrf_token != session_token:
            logger.warn("CSRF攻撃の可能性",
                client_ip=request.client.host,
                path=request.url.path,
                action="csrf_attack_detected",
                security=True
            )

            raise HTTPException(
```
