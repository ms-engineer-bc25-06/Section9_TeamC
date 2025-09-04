"""バックグラウンド監視タスク"""

import threading
import time

from app.core.alert_monitor import alert_monitor
from app.core.alert_notifier import notification_manager
from app.core.logging_config import get_logger

logger = get_logger(__name__)


class MonitoringTask:
    """監視タスク管理"""

    def __init__(self, check_interval: int = 30):
        self.check_interval = check_interval  # 30秒間隔
        self.running = False
        self.thread = None

        # アラートハンドラーを登録
        alert_monitor.add_alert_handler(self.handle_alert)

    def handle_alert(self, alert_event):
        """アラート処理"""
        try:
            # 同期版通知を使用（バックグラウンドスレッドから実行）
            notification_manager.send_alert_sync(alert_event)
        except Exception as e:
            logger.error(f"アラート処理エラー: {e}")

    def monitoring_loop(self):
        """監視ループ"""
        logger.info("監視タスク開始")

        while self.running:
            try:
                # 監視チェック実行
                alert_monitor.run_monitoring_cycle()
                time.sleep(self.check_interval)
            except Exception as e:
                logger.error(f"監視ループエラー: {e}")
                time.sleep(self.check_interval)

        logger.info("監視タスク終了")

    def start(self):
        """監視開始"""
        if self.running:
            logger.warning("監視タスクは既に実行中です")
            return

        self.running = True
        self.thread = threading.Thread(target=self.monitoring_loop, daemon=True)
        self.thread.start()
        logger.info(f"監視タスク開始 (チェック間隔: {self.check_interval}秒)")

    def stop(self):
        """監視停止"""
        if not self.running:
            return

        self.running = False
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=5)
        logger.info("監視タスク停止")


# グローバル監視タスク
monitoring_task = MonitoringTask()


# アプリケーション起動時に監視を開始する関数
def start_monitoring():
    """監視開始"""
    monitoring_task.start()


def stop_monitoring():
    """監視停止"""
    monitoring_task.stop()
