"""アラート通知システム - コンソール出力ベース最低限実装"""

import asyncio
import json
from datetime import datetime

from app.core.alert_monitor import AlertEvent
from app.core.logging_config import get_logger

logger = get_logger(__name__)


class ConsoleNotifier:
    """コンソール通知（最低限実装）"""

    def __init__(self):
        self.name = "console"

    def format_alert(self, alert: AlertEvent) -> str:
        """アラート整形"""
        severity_icons = {"low": "💙", "medium": "⚠️", "high": "🚨", "critical": "🔴"}

        icon = severity_icons.get(alert.rule.severity.value, "⚠️")
        timestamp = datetime.fromtimestamp(alert.timestamp).strftime("%Y-%m-%d %H:%M:%S")

        alert_info = {
            "alert_id": alert.alert_id,
            "severity": alert.rule.severity.value.upper(),
            "rule_name": alert.rule.name,
            "message": alert.message,
            "current_value": alert.current_value,
            "threshold": alert.threshold,
            "timestamp": timestamp,
        }

        formatted = f"""
{icon} ========== ALERT TRIGGERED ==========
ID: {alert_info['alert_id']}
重要度: {alert_info['severity']}
ルール: {alert_info['rule_name']}
メッセージ: {alert_info['message']}
現在値: {alert_info['current_value']}
閾値: {alert_info['threshold']}
発生時刻: {alert_info['timestamp']}
=====================================
"""
        return formatted

    async def send_notification(self, alert: AlertEvent):
        """通知送信"""
        formatted_alert = self.format_alert(alert)
        print(formatted_alert)

        # ログにも記録
        alert_data = {
            "alert_id": alert.alert_id,
            "severity": alert.rule.severity.value,
            "rule_name": alert.rule.name,
            "message": alert.message,
            "current_value": alert.current_value,
            "threshold": alert.threshold,
            "timestamp": alert.timestamp,
        }
        logger.warning(f"CONSOLE_ALERT | {json.dumps(alert_data, ensure_ascii=False)}")


class FileNotifier:
    """ファイル通知（アラートログ）"""

    def __init__(self, log_file_path: str = "logs/alerts.log"):
        self.log_file_path = log_file_path
        self.name = "file"

    async def send_notification(self, alert: AlertEvent):
        """アラートファイルに記録"""
        alert_data = {
            "alert_id": alert.alert_id,
            "severity": alert.rule.severity.value,
            "rule_name": alert.rule.name,
            "alert_type": alert.rule.alert_type.value,
            "message": alert.message,
            "current_value": alert.current_value,
            "threshold": alert.threshold,
            "description": alert.rule.description,
            "timestamp": alert.timestamp,
            "datetime": datetime.fromtimestamp(alert.timestamp).isoformat(),
        }

        try:
            import os

            os.makedirs(os.path.dirname(self.log_file_path), exist_ok=True)

            with open(self.log_file_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(alert_data, ensure_ascii=False) + "\n")

            logger.info(f"アラートファイル記録: {self.log_file_path}")
        except Exception as e:
            logger.error(f"アラートファイル記録エラー: {e}")


class AlertNotificationManager:
    """アラート通知管理"""

    def __init__(self):
        self.notifiers = [ConsoleNotifier(), FileNotifier()]

    async def send_alert(self, alert: AlertEvent):
        """全通知方法でアラート送信"""
        tasks = []
        for notifier in self.notifiers:
            tasks.append(notifier.send_notification(alert))

        try:
            await asyncio.gather(*tasks, return_exceptions=True)
        except Exception as e:
            logger.error(f"アラート通知エラー: {e}")

    def send_alert_sync(self, alert: AlertEvent):
        """同期版アラート送信"""
        try:
            loop = asyncio.get_event_loop()
            loop.run_until_complete(self.send_alert(alert))
        except Exception:
            # イベントループが既に実行中の場合の同期実行
            for notifier in self.notifiers:
                try:
                    if hasattr(notifier, "send_notification"):
                        # ConsoleNotifierは同期実行可能
                        if notifier.name == "console":
                            formatted_alert = notifier.format_alert(alert)
                            print(formatted_alert)
                        elif notifier.name == "file":
                            # FileNotifierも同期実行可能に
                            import json

                            alert_data = {
                                "alert_id": alert.alert_id,
                                "severity": alert.rule.severity.value,
                                "rule_name": alert.rule.name,
                                "alert_type": alert.rule.alert_type.value,
                                "message": alert.message,
                                "current_value": alert.current_value,
                                "threshold": alert.threshold,
                                "timestamp": alert.timestamp,
                                "datetime": datetime.fromtimestamp(alert.timestamp).isoformat(),
                            }

                            # ディレクトリが存在しない場合は作成不要（logsフォルダは既存）
                            with open(notifier.log_file_path, "a", encoding="utf-8") as f:
                                f.write(json.dumps(alert_data, ensure_ascii=False) + "\n")
                            logger.info(f"アラートファイル記録: {notifier.log_file_path}")
                except Exception as e:
                    logger.error(f"通知エラー ({notifier.name}): {e}")


# グローバル通知管理インスタンス
notification_manager = AlertNotificationManager()
