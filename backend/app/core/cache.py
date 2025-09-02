"""キャッシュ機能 - 適切な場面でのキャッシュ利用とパフォーマンス向上"""

import functools
import time
from typing import Dict, Any, Optional, Callable
from datetime import datetime, timedelta
import json
import hashlib
from app.core.logging_config import get_logger

logger = get_logger(__name__)

class SimpleMemoryCache:
    """シンプルなメモリキャッシュ実装（Redis未使用時）"""
    
    def __init__(self, max_size: int = 1000):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._max_size = max_size
        self._access_times: Dict[str, float] = {}
    
    def get(self, key: str) -> Optional[Any]:
        """キャッシュから値を取得"""
        if key not in self._cache:
            return None
        
        cache_entry = self._cache[key]
        
        # TTL（Time To Live）チェック
        if cache_entry.get('expires_at', 0) < time.time():
            self._remove(key)
            return None
        
        # アクセス時間を更新（LRU用）
        self._access_times[key] = time.time()
        return cache_entry['value']
    
    def set(self, key: str, value: Any, ttl: int = 300) -> None:
        """キャッシュに値を設定（デフォルト5分）"""
        # キャッシュサイズ制限チェック
        if len(self._cache) >= self._max_size and key not in self._cache:
            self._evict_lru()
        
        expires_at = time.time() + ttl
        self._cache[key] = {
            'value': value,
            'expires_at': expires_at,
            'created_at': time.time()
        }
        self._access_times[key] = time.time()
        
        logger.debug(f"Cache SET: {key} (TTL: {ttl}s)")
    
    def _remove(self, key: str) -> None:
        """キーを削除"""
        self._cache.pop(key, None)
        self._access_times.pop(key, None)
    
    def _evict_lru(self) -> None:
        """LRU（Least Recently Used）でエビクション"""
        if not self._access_times:
            return
        
        lru_key = min(self._access_times, key=self._access_times.get)
        self._remove(lru_key)
        logger.debug(f"Cache LRU eviction: {lru_key}")

# グローバルキャッシュインスタンス
_cache = SimpleMemoryCache()

def cached(ttl: int = 300, key_prefix: str = ""):
    """
    関数結果をキャッシュするデコレータ
    
    Args:
        ttl: キャッシュ有効期間（秒）
        key_prefix: キャッシュキーのプレフィックス
    """
    def decorator(func: Callable):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # キャッシュキーを生成
            cache_key = _generate_cache_key(func.__name__, args, kwargs, key_prefix)
            
            # キャッシュから取得を試行
            cached_result = _cache.get(cache_key)
            if cached_result is not None:
                logger.debug(f"Cache HIT: {cache_key}")
                return cached_result
            
            # キャッシュミス時は関数を実行
            logger.debug(f"Cache MISS: {cache_key}")
            result = func(*args, **kwargs)
            
            # 結果をキャッシュに保存
            _cache.set(cache_key, result, ttl)
            return result
        
        return wrapper
    return decorator

def _generate_cache_key(func_name: str, args: tuple, kwargs: dict, prefix: str = "") -> str:
    """キャッシュキーを生成"""
    # 引数をJSON文字列に変換してハッシュ化
    args_str = json.dumps([str(arg) for arg in args], sort_keys=True)
    kwargs_str = json.dumps(kwargs, sort_keys=True, default=str)
    
    combined = f"{func_name}:{args_str}:{kwargs_str}"
    cache_key = hashlib.md5(combined.encode()).hexdigest()
    
    if prefix:
        cache_key = f"{prefix}:{cache_key}"
    
    return cache_key

# キャッシュを利用すべき場面の判断基準
def should_cache_api_response(endpoint: str, user_context: dict = None) -> tuple[bool, int]:
    """
    APIレスポンスをキャッシュすべきかを判断
    
    Returns:
        (should_cache: bool, ttl: int)
    """
    # 静的データ（5分キャッシュ）
    static_endpoints = ["/api/phrases", "/api/help-content"]
    if endpoint in static_endpoints:
        return True, 300
    
    # ユーザー固有だが変更頻度の低いデータ（2分キャッシュ）
    user_data_endpoints = ["/api/children", "/api/user/profile"]
    if any(endpoint.startswith(ep) for ep in user_data_endpoints):
        return True, 120
    
    # 会話履歴（30秒キャッシュ - 比較的新しいデータが重要）
    if "/api/conversations" in endpoint:
        return True, 30
    
    # リアルタイム性が重要なデータはキャッシュしない
    realtime_endpoints = ["/api/voice/transcribe", "/health"]
    if any(endpoint.startswith(ep) for ep in realtime_endpoints):
        return False, 0
    
    return False, 0

# 使用例のサンプル関数
@cached(ttl=300, key_prefix="children")
def get_cached_children_data(user_id: int) -> dict:
    """子どもデータの取得（キャッシュ付き）"""
    # 実際のDB処理はここで実行される
    # この関数は同じuser_idで5分間はキャッシュから返される
    pass

@cached(ttl=600, key_prefix="static")  
def get_cached_help_phrases() -> list:
    """お助けフレーズ（10分キャッシュ）"""
    # 静的コンテンツは長めのキャッシュ
    pass

def get_cache_stats() -> dict:
    """キャッシュ統計情報を取得"""
    return {
        "cache_size": len(_cache._cache),
        "max_size": _cache._max_size,
        "usage_percent": (len(_cache._cache) / _cache._max_size) * 100
    }