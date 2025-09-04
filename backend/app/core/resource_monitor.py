"""リソース管理とモニタリング - メモリ、I/O、DB接続の適切な管理"""

import gc
from datetime import datetime
from typing import Dict, List

import psutil

from app.core.logging_config import get_logger

logger = get_logger("resource_monitor")


class ResourceMonitor:
    """システムリソースの監視と管理"""

    def __init__(self):
        self.alerts_sent = set()
        self.monitoring_enabled = True

        # リソース警告しきい値
        self.thresholds = {
            "memory_warning": 80,  # メモリ使用率80%で警告
            "memory_critical": 90,  # メモリ使用率90%で重大警告
            "cpu_warning": 85,  # CPU使用率85%で警告
            "disk_warning": 85,  # ディスク使用率85%で警告
            "disk_critical": 95,  # ディスク使用率95%で重大警告
        }

    def get_system_resources(self) -> Dict:
        """現在のシステムリソース状況を取得"""
        try:
            # CPU使用率
            cpu_percent = psutil.cpu_percent(interval=1)

            # メモリ情報
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            memory_available = memory.available / (1024**3)  # GB

            # ディスク情報
            disk = psutil.disk_usage("/")
            disk_percent = (disk.used / disk.total) * 100
            disk_free = disk.free / (1024**3)  # GB

            # プロセス情報
            process = psutil.Process()
            process_memory = process.memory_info().rss / (1024**2)  # MB
            process_cpu = process.cpu_percent()

            # ネットワークI/O
            net_io = psutil.net_io_counters()

            # ディスクI/O
            disk_io = psutil.disk_io_counters()

            return {
                "timestamp": datetime.now().isoformat(),
                "cpu": {"percent": cpu_percent, "process_percent": process_cpu},
                "memory": {
                    "total_gb": memory.total / (1024**3),
                    "used_percent": memory_percent,
                    "available_gb": memory_available,
                    "process_mb": process_memory,
                },
                "disk": {
                    "total_gb": disk.total / (1024**3),
                    "used_percent": disk_percent,
                    "free_gb": disk_free,
                },
                "network_io": (
                    {
                        "bytes_sent": net_io.bytes_sent if net_io else 0,
                        "bytes_recv": net_io.bytes_recv if net_io else 0,
                    }
                    if net_io
                    else None
                ),
                "disk_io": (
                    {
                        "read_bytes": disk_io.read_bytes if disk_io else 0,
                        "write_bytes": disk_io.write_bytes if disk_io else 0,
                    }
                    if disk_io
                    else None
                ),
            }

        except Exception as e:
            logger.error(f"Resource monitoring error: {e}")
            return {"error": str(e)}

    def check_resource_alerts(self, resources: Dict) -> List[str]:
        """リソース使用量をチェックしてアラートを生成"""
        alerts = []

        # メモリアラート
        memory_percent = resources.get("memory", {}).get("used_percent", 0)
        if memory_percent >= self.thresholds["memory_critical"]:
            alert = f"CRITICAL: Memory usage {memory_percent:.1f}%"
            if alert not in self.alerts_sent:
                alerts.append(alert)
                self.alerts_sent.add(alert)
                logger.critical(alert)
        elif memory_percent >= self.thresholds["memory_warning"]:
            alert = f"WARNING: Memory usage {memory_percent:.1f}%"
            if alert not in self.alerts_sent:
                alerts.append(alert)
                self.alerts_sent.add(alert)
                logger.warning(alert)

        # CPU警告
        cpu_percent = resources.get("cpu", {}).get("percent", 0)
        if cpu_percent >= self.thresholds["cpu_warning"]:
            alert = f"WARNING: High CPU usage {cpu_percent:.1f}%"
            if alert not in self.alerts_sent:
                alerts.append(alert)
                self.alerts_sent.add(alert)
                logger.warning(alert)

        # ディスク警告
        disk_percent = resources.get("disk", {}).get("used_percent", 0)
        if disk_percent >= self.thresholds["disk_critical"]:
            alert = f"CRITICAL: Disk usage {disk_percent:.1f}%"
            if alert not in self.alerts_sent:
                alerts.append(alert)
                self.alerts_sent.add(alert)
                logger.critical(alert)
        elif disk_percent >= self.thresholds["disk_warning"]:
            alert = f"WARNING: Disk usage {disk_percent:.1f}%"
            if alert not in self.alerts_sent:
                alerts.append(alert)
                self.alerts_sent.add(alert)
                logger.warning(alert)

        return alerts

    def force_garbage_collection(self) -> Dict:
        """メモリ使用量が高い時の強制ガベージコレクション"""
        before_memory = psutil.virtual_memory().percent

        # Pythonガベージコレクションを実行
        collected = gc.collect()

        after_memory = psutil.virtual_memory().percent
        freed_memory = before_memory - after_memory

        logger.info(f"GC: Collected {collected} objects, freed {freed_memory:.2f}% memory")

        return {
            "objects_collected": collected,
            "memory_before_percent": before_memory,
            "memory_after_percent": after_memory,
            "memory_freed_percent": freed_memory,
        }


# グローバルリソースモニター
resource_monitor = ResourceMonitor()


class DatabaseConnectionMonitor:
    """データベース接続のリソース管理"""

    def __init__(self):
        self.active_connections = 0
        self.peak_connections = 0
        self.connection_history = []

    def track_connection(self, acquired: bool = True):
        """接続の取得/解放を追跡"""
        if acquired:
            self.active_connections += 1
            self.peak_connections = max(self.peak_connections, self.active_connections)
            logger.debug(f"DB connection acquired. Active: {self.active_connections}")
        else:
            self.active_connections = max(0, self.active_connections - 1)
            logger.debug(f"DB connection released. Active: {self.active_connections}")

        # 履歴記録（最大100件）
        self.connection_history.append(
            {
                "timestamp": datetime.now(),
                "active_connections": self.active_connections,
                "action": "acquire" if acquired else "release",
            }
        )

        if len(self.connection_history) > 100:
            self.connection_history.pop(0)

    def get_connection_stats(self) -> Dict:
        """接続統計を取得"""
        return {
            "active_connections": self.active_connections,
            "peak_connections": self.peak_connections,
            "history_size": len(self.connection_history),
            "recent_activity": self.connection_history[-10:] if self.connection_history else [],
        }


# グローバルDB接続モニター
db_monitor = DatabaseConnectionMonitor()


def get_resource_summary() -> Dict:
    """リソース使用状況の要約を取得"""
    resources = resource_monitor.get_system_resources()
    db_stats = db_monitor.get_connection_stats()

    return {
        "system_resources": resources,
        "database_connections": db_stats,
        "monitoring_enabled": resource_monitor.monitoring_enabled,
        "thresholds": resource_monitor.thresholds,
    }
