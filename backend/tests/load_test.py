"""負荷テスト - システムの耐久性とパフォーマンス評価"""

from locust import HttpUser, task, between
import json
import random

class BudApiUser(HttpUser):
    """BUD APIの負荷テストユーザー"""
    
    wait_time = between(1, 3)  # リクエスト間隔1-3秒
    
    def on_start(self):
        """テスト開始時のセットアップ"""
        # ヘルスチェックで接続確認
        response = self.client.get("/health")
        if response.status_code != 200:
            print(f"Health check failed: {response.status_code}")
    
    @task(5)
    def health_check(self):
        """ヘルスチェック（最も高頻度）"""
        with self.client.get("/health", catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Health check failed: {response.status_code}")
    
    @task(3)
    def detailed_health_check(self):
        """詳細ヘルスチェック（中頻度）"""
        with self.client.get("/health/detailed", catch_response=True) as response:
            if response.status_code == 200:
                data = response.json()
                # レスポンスタイムチェック
                if "checks" in data and "database" in data["checks"]:
                    db_time = data["checks"]["database"].get("response_time_ms", 0)
                    if db_time > 200:  # 200ms以上は遅い
                        response.failure(f"Slow DB response: {db_time}ms")
                    else:
                        response.success()
            else:
                response.failure(f"Detailed health check failed")
    
    @task(2)
    def get_children(self):
        """子どもリスト取得（低頻度）"""
        # 認証なしでのテスト（エラーレスポンスも含めて負荷テスト）
        with self.client.get("/api/children", catch_response=True) as response:
            if response.status_code in [200, 401, 403]:
                response.success()  # 認証エラーも期待される動作
            else:
                response.failure(f"Unexpected status: {response.status_code}")
    
    @task(1)
    def voice_transcribe_simulation(self):
        """音声認識シミュレーション（最も低頻度・重い処理）"""
        # 実際の音声ファイルの代わりにダミーデータ
        dummy_data = {
            "audio_data": "base64_encoded_audio_here",
            "duration": random.randint(5, 30)  # 5-30秒の音声
        }
        
        with self.client.post(
            "/api/voice/transcribe",
            json=dummy_data,
            catch_response=True
        ) as response:
            if response.status_code in [200, 401, 422]:
                response.success()
            else:
                response.failure(f"Voice API error: {response.status_code}")


class StressTestUser(HttpUser):
    """ストレステスト用の高負荷ユーザー"""
    
    wait_time = between(0.1, 0.5)  # 短い間隔で高負荷
    
    @task
    def rapid_health_checks(self):
        """高速ヘルスチェック"""
        self.client.get("/health", name="rapid_health")
    
    @task
    def concurrent_db_access(self):
        """同時DB接続テスト"""
        self.client.get("/health/detailed", name="db_stress")


# 負荷テスト実行コマンド例：
# locust -f tests/load_test.py --host=http://localhost:8000 --users=10 --spawn-rate=2 --time=60s

# パフォーマンス目標（docs/performance.mdより）：
# - レスポンスタイム: < 200ms
# - スループット: > 100 req/sec
# - エラー率: < 0.1%