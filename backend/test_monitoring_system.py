"""監視・アラートシステムのテスト"""

import time
import sys
sys.path.append('.')

from app.core.alert_monitor import record_error, record_security_warning, record_auth_failure, record_slow_request, alert_monitor
from app.core.logging_config import setup_logging

# ログ設定
setup_logging()

def test_alert_system():
    """アラートシステムテスト"""

    print("🔍 監視・アラートシステムテスト開始...")

    # 1. エラー多発テスト（閾値: 10回/分）
    print("\n1. エラー多発アラートテスト")
    for i in range(12):  # 閾値を超える
        record_error()
        print(f"   エラー記録: {i+1}/12")

    print("   監視チェック実行...")
    alert_monitor.run_monitoring_cycle()
    time.sleep(1)

    # 2. セキュリティイベント多発テスト（閾値: 5回/分）
    print("\n2. セキュリティイベントアラートテスト")
    for i in range(6):  # 閾値を超える
        record_security_warning()
        print(f"   セキュリティ警告記録: {i+1}/6")

    print("   監視チェック実行...")
    alert_monitor.run_monitoring_cycle()
    time.sleep(1)

    # 3. 認証失敗多発テスト（閾値: 20回/5分）
    print("\n3. 認証失敗アラートテスト")
    for i in range(22):  # 閾値を超える
        record_auth_failure()
        if i % 5 == 0:  # 進捗表示
            print(f"   認証失敗記録: {i+1}/22")

    print("   監視チェック実行...")
    alert_monitor.run_monitoring_cycle()
    time.sleep(1)

    # 4. 遅いリクエストテスト（閾値: 5秒以上）
    print("\n4. パフォーマンスアラートテスト")
    record_slow_request(6000)  # 6秒の遅いリクエスト
    print("   遅いリクエスト記録: 6000ms")

    print("   監視チェック実行...")
    alert_monitor.run_monitoring_cycle()
    time.sleep(1)

    # 5. 正常範囲のテスト（アラートが出ないことを確認）
    print("\n5. 正常範囲テスト（アラートなし）")
    for i in range(3):  # 閾値未満
        record_error()
        print(f"   正常範囲エラー記録: {i+1}/3")

    print("   監視チェック実行...")
    alert_monitor.run_monitoring_cycle()
    time.sleep(1)

    print("\n✅ 監視・アラートシステムテスト完了")
    print("📄 アラートファイル確認: backend/logs/alerts.log")

if __name__ == "__main__":
    test_alert_system()
