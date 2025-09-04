"""アラート設定 - ログベース監視とアラート閾値管理"""

import time
from dataclasses import dataclass
from enum import Enum
from typing import Dict, Optional


class AlertSeverity(Enum):
    """アラート重要度"""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AlertType(Enum):
    """アラートタイプ"""

    ERROR_RATE = "error_rate"
    SECURITY_EVENT = "security_event"
    PERFORMANCE = "performance"
    AUTHENTICATION_FAILURE = "auth_failure"


@dataclass
class AlertRule:
    """アラートルール定義"""

    name: str
    alert_type: AlertType
    severity: AlertSeverity
    threshold: float
    time_window_seconds: int
    description: str
    enabled: bool = True


class AlertConfig:
    """アラート設定管理"""

    # デフォルトアラートルール（最低限実装）
    DEFAULT_RULES = [
        AlertRule(
            name="高頻度エラー検知",
            alert_type=AlertType.ERROR_RATE,
            severity=AlertSeverity.HIGH,
            threshold=10.0,  # 10回/分
            time_window_seconds=60,
            description="エラー発生率が異常に高い場合にアラート",
        ),
        AlertRule(
            name="セキュリティイベント検知",
            alert_type=AlertType.SECURITY_EVENT,
            severity=AlertSeverity.CRITICAL,
            threshold=5.0,  # 5回/分
            time_window_seconds=60,
            description="セキュリティ警告が連続発生した場合にアラート",
        ),
        AlertRule(
            name="認証失敗多発検知",
            alert_type=AlertType.AUTHENTICATION_FAILURE,
            severity=AlertSeverity.MEDIUM,
            threshold=20.0,  # 20回/5分
            time_window_seconds=300,
            description="認証失敗が異常に多い場合にアラート",
        ),
        AlertRule(
            name="レスポンス遅延検知",
            alert_type=AlertType.PERFORMANCE,
            severity=AlertSeverity.MEDIUM,
            threshold=5000.0,  # 5秒以上
            time_window_seconds=300,
            description="レスポンス時間が異常に遅い場合にアラート",
        ),
    ]

    @classmethod
    def get_rules(cls) -> Dict[str, AlertRule]:
        """アラートルール取得"""
        return {rule.name: rule for rule in cls.DEFAULT_RULES}

    @classmethod
    def get_rule_by_type(cls, alert_type: AlertType) -> Optional[AlertRule]:
        """タイプ別ルール取得"""
        for rule in cls.DEFAULT_RULES:
            if rule.alert_type == alert_type:
                return rule
        return None


# メトリクス収集用のカウンタークラス
class MetricsCounter:
    """メトリクス収集"""

    def __init__(self):
        self._counters: Dict[str, list] = {}

    def increment(self, metric_name: str, timestamp: Optional[float] = None):
        """カウンタ増加"""
        if timestamp is None:
            timestamp = time.time()

        if metric_name not in self._counters:
            self._counters[metric_name] = []

        self._counters[metric_name].append(timestamp)

    def get_count_in_window(self, metric_name: str, time_window_seconds: int) -> int:
        """指定時間窓内のカウント取得"""
        if metric_name not in self._counters:
            return 0

        current_time = time.time()
        cutoff_time = current_time - time_window_seconds

        # 古いデータを削除
        self._counters[metric_name] = [
            timestamp for timestamp in self._counters[metric_name] if timestamp > cutoff_time
        ]

        return len(self._counters[metric_name])

    def clear_metric(self, metric_name: str):
        """メトリクスクリア"""
        if metric_name in self._counters:
            self._counters[metric_name] = []


# グローバルメトリクスカウンター
metrics_counter = MetricsCounter()
