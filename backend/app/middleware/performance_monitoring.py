"""性能測定ミドルウェア - レスポンスタイムとスループット計測"""

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.logging_config import get_logger
import time
from typing import Dict
from collections import deque
from datetime import datetime, timedelta
import asyncio

logger = get_logger("performance")

class PerformanceMonitoringMiddleware(BaseHTTPMiddleware):
    """APIレスポンスタイムとスループットを測定"""
    
    def __init__(self, app):
        super().__init__(app)
        # 最近1分間のリクエスト記録
        self.recent_requests = deque(maxlen=1000)
        # エンドポイント別のレスポンスタイム記録
        self.response_times: Dict[str, deque] = {}
        # 性能要件（docs/performance.mdより）
        self.target_response_time = 200  # ms
        self.target_throughput = 100  # req/sec
        
    async def dispatch(self, request: Request, call_next):
        # 測定開始
        start_time = time.time()
        path = request.url.path
        
        # リクエスト処理
        response = await call_next(request)
        
        # レスポンスタイム計算（ミリ秒）
        response_time = (time.time() - start_time) * 1000
        
        # 記録
        self.record_request(path, response_time)
        
        # ヘッダーに性能情報を追加
        response.headers["X-Response-Time"] = f"{response_time:.2f}ms"
        
        # 性能要件チェック
        if response_time > self.target_response_time:
            logger.warning(
                f"Slow response: {path} took {response_time:.2f}ms "
                f"(target: {self.target_response_time}ms)"
            )
        
        # 定期的に統計情報をログ出力（1分ごと）
        if len(self.recent_requests) % 100 == 0:
            await self.log_performance_stats()
        
        return response
    
    def record_request(self, path: str, response_time: float):
        """リクエストを記録"""
        now = datetime.now()
        self.recent_requests.append({
            "timestamp": now,
            "path": path,
            "response_time": response_time
        })
        
        # エンドポイント別の記録
        if path not in self.response_times:
            self.response_times[path] = deque(maxlen=100)
        self.response_times[path].append(response_time)
    
    async def log_performance_stats(self):
        """性能統計をログ出力"""
        if not self.recent_requests:
            return
        
        # 直近1分間のリクエストを抽出
        one_minute_ago = datetime.now() - timedelta(minutes=1)
        recent = [r for r in self.recent_requests 
                 if r["timestamp"] > one_minute_ago]
        
        if not recent:
            return
        
        # スループット計算（req/sec）
        throughput = len(recent) / 60.0
        
        # 平均レスポンスタイム
        avg_response_time = sum(r["response_time"] for r in recent) / len(recent)
        
        # エンドポイント別統計
        endpoint_stats = {}
        for path, times in self.response_times.items():
            if times:
                endpoint_stats[path] = {
                    "avg": sum(times) / len(times),
                    "max": max(times),
                    "min": min(times)
                }
        
        # ログ出力
        logger.info(
            f"Performance Stats - "
            f"Throughput: {throughput:.2f} req/sec (target: {self.target_throughput}), "
            f"Avg Response: {avg_response_time:.2f}ms (target: {self.target_response_time}ms)"
        )
        
        # 性能要件違反チェック
        if throughput < self.target_throughput * 0.8:
            logger.warning(f"Low throughput: {throughput:.2f} req/sec")
        
        # エンドポイント別の詳細
        for path, stats in endpoint_stats.items():
            if stats["avg"] > self.target_response_time:
                logger.warning(
                    f"Endpoint {path} - "
                    f"Avg: {stats['avg']:.2f}ms, "
                    f"Max: {stats['max']:.2f}ms"
                )

def get_performance_metrics() -> Dict:
    """現在の性能メトリクスを取得（API用）"""
    # この関数は他のモジュールから呼び出し可能
    return {
        "target_response_time_ms": 200,
        "target_throughput_req_sec": 100,
        "measurement": "Real-time monitoring enabled"
    }