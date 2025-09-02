"""リアルタイム監視・アラートシステム"""

import asyncio
import time
from typing import Dict, List, Optional, Callable
from datetime import datetime
from app.core.alert_config import AlertRule, AlertType, AlertSeverity, AlertConfig, metrics_counter
from app.core.logging_config import get_logger

logger = get_logger(__name__)

class AlertEvent:
    """アラートイベント"""
    
    def __init__(self, rule: AlertRule, current_value: float, message: str):
        self.rule = rule
        self.current_value = current_value
        self.threshold = rule.threshold
        self.timestamp = time.time()
        self.datetime = datetime.fromtimestamp(self.timestamp)
        self.message = message
        self.alert_id = f"{rule.name}_{int(self.timestamp)}"

class AlertMonitor:
    """監視・アラートマネージャー"""
    
    def __init__(self):
        self.rules = AlertConfig.get_rules()
        self.alert_handlers: List[Callable] = []
        self.recent_alerts: Dict[str, float] = {}  # アラート重複防止
        self.suppression_window = 300  # 5分間の重複防止
        
    def add_alert_handler(self, handler: Callable[[AlertEvent], None]):
        """アラートハンドラー追加"""
        self.alert_handlers.append(handler)
        
    def check_error_rate(self) -> Optional[AlertEvent]:
        """エラー率監視"""
        rule = AlertConfig.get_rule_by_type(AlertType.ERROR_RATE)
        if not rule or not rule.enabled:
            return None
            
        error_count = metrics_counter.get_count_in_window("errors", rule.time_window_seconds)
        
        if error_count >= rule.threshold:
            message = f"エラー発生率異常: {error_count}件/{rule.time_window_seconds}秒 (閾値: {rule.threshold})"
            return AlertEvent(rule, error_count, message)
        return None
    
    def check_security_events(self) -> Optional[AlertEvent]:
        """セキュリティイベント監視"""
        rule = AlertConfig.get_rule_by_type(AlertType.SECURITY_EVENT)
        if not rule or not rule.enabled:
            return None
            
        security_count = metrics_counter.get_count_in_window("security_warnings", rule.time_window_seconds)
        
        if security_count >= rule.threshold:
            message = f"セキュリティイベント多発: {security_count}件/{rule.time_window_seconds}秒 (閾値: {rule.threshold})"
            return AlertEvent(rule, security_count, message)
        return None
    
    def check_auth_failures(self) -> Optional[AlertEvent]:
        """認証失敗監視"""
        rule = AlertConfig.get_rule_by_type(AlertType.AUTHENTICATION_FAILURE)
        if not rule or not rule.enabled:
            return None
            
        auth_failure_count = metrics_counter.get_count_in_window("auth_failures", rule.time_window_seconds)
        
        if auth_failure_count >= rule.threshold:
            message = f"認証失敗多発: {auth_failure_count}件/{rule.time_window_seconds}秒 (閾値: {rule.threshold})"
            return AlertEvent(rule, auth_failure_count, message)
        return None
    
    def check_performance(self) -> Optional[AlertEvent]:
        """パフォーマンス監視"""
        rule = AlertConfig.get_rule_by_type(AlertType.PERFORMANCE)
        if not rule or not rule.enabled:
            return None
            
        slow_requests = metrics_counter.get_count_in_window("slow_requests", rule.time_window_seconds)
        
        if slow_requests >= 1:  # 1件でも遅いリクエストがあればアラート
            message = f"レスポンス遅延検出: {slow_requests}件の遅延リクエスト/{rule.time_window_seconds}秒"
            return AlertEvent(rule, slow_requests, message)
        return None
    
    def should_suppress_alert(self, alert_event: AlertEvent) -> bool:
        """アラート重複抑制判定"""
        rule_name = alert_event.rule.name
        current_time = time.time()
        
        if rule_name in self.recent_alerts:
            last_alert_time = self.recent_alerts[rule_name]
            if current_time - last_alert_time < self.suppression_window:
                return True
                
        self.recent_alerts[rule_name] = current_time
        return False
    
    def trigger_alert(self, alert_event: AlertEvent):
        """アラート発火"""
        if self.should_suppress_alert(alert_event):
            logger.debug(f"アラート抑制: {alert_event.rule.name}")
            return
            
        # ログに記録
        severity_map = {
            AlertSeverity.LOW: logger.info,
            AlertSeverity.MEDIUM: logger.warning,
            AlertSeverity.HIGH: logger.error,
            AlertSeverity.CRITICAL: logger.critical
        }
        
        log_func = severity_map.get(alert_event.rule.severity, logger.warning)
        log_func(f"ALERT | {alert_event.alert_id} | {alert_event.message}")
        
        # アラートハンドラー実行
        for handler in self.alert_handlers:
            try:
                handler(alert_event)
            except Exception as e:
                logger.error(f"アラートハンドラーエラー: {e}")
    
    def run_monitoring_cycle(self):
        """監視サイクル実行"""
        checks = [
            self.check_error_rate,
            self.check_security_events,
            self.check_auth_failures,
            self.check_performance
        ]
        
        for check in checks:
            try:
                alert_event = check()
                if alert_event:
                    self.trigger_alert(alert_event)
            except Exception as e:
                logger.error(f"監視チェックエラー: {e}")

# グローバル監視インスタンス
alert_monitor = AlertMonitor()

# メトリクス記録用ヘルパー関数
def record_error():
    """エラー記録"""
    metrics_counter.increment("errors")

def record_security_warning():
    """セキュリティ警告記録"""
    metrics_counter.increment("security_warnings")

def record_auth_failure():
    """認証失敗記録"""
    metrics_counter.increment("auth_failures")

def record_slow_request(duration_ms: float):
    """遅いリクエスト記録"""
    if duration_ms > 5000:  # 5秒以上
        metrics_counter.increment("slow_requests")