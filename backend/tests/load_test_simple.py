"""簡易負荷テスト - 最低限の性能評価（Pythonのみで実行可能）"""

import asyncio
import aiohttp
import time
from typing import List, Dict
import statistics

# テスト設定
BASE_URL = "http://localhost:8000"
CONCURRENT_USERS = 10  # 同時接続ユーザー数
REQUESTS_PER_USER = 10  # 各ユーザーのリクエスト数
TARGET_RESPONSE_TIME = 0.2  # 目標レスポンスタイム（秒）

async def make_request(session: aiohttp.ClientSession, url: str) -> Dict:
    """単一リクエストを実行して結果を返す"""
    start_time = time.time()
    try:
        async with session.get(url) as response:
            await response.text()
            response_time = time.time() - start_time
            return {
                "status": response.status,
                "response_time": response_time,
                "success": response.status == 200
            }
    except Exception as e:
        return {
            "status": 0,
            "response_time": time.time() - start_time,
            "success": False,
            "error": str(e)
        }

async def user_simulation(user_id: int) -> List[Dict]:
    """1ユーザーの動作をシミュレート"""
    results = []
    async with aiohttp.ClientSession() as session:
        for i in range(REQUESTS_PER_USER):
            # ヘルスチェックエンドポイントをテスト
            result = await make_request(session, f"{BASE_URL}/health")
            result["user_id"] = user_id
            result["request_id"] = i
            results.append(result)

            # リクエスト間隔（0.5-1秒）
            await asyncio.sleep(0.5 + (i % 2) * 0.5)

    return results

async def run_load_test():
    """負荷テストを実行"""
    print("🚀 負荷テスト開始")
    print(f"- 同時ユーザー数: {CONCURRENT_USERS}")
    print(f"- リクエスト/ユーザー: {REQUESTS_PER_USER}")
    print(f"- 合計リクエスト数: {CONCURRENT_USERS * REQUESTS_PER_USER}")
    print(f"- 目標レスポンスタイム: {TARGET_RESPONSE_TIME * 1000:.0f}ms")
    print("-" * 50)

    start_time = time.time()

    # 全ユーザーを同時実行
    tasks = [user_simulation(i) for i in range(CONCURRENT_USERS)]
    all_results = await asyncio.gather(*tasks)

    # 結果を平坦化
    results = [r for user_results in all_results for r in user_results]

    total_time = time.time() - start_time

    # 統計計算
    successful_requests = [r for r in results if r["success"]]
    failed_requests = [r for r in results if not r["success"]]
    response_times = [r["response_time"] for r in successful_requests]

    if response_times:
        avg_response_time = statistics.mean(response_times)
        median_response_time = statistics.median(response_times)
        max_response_time = max(response_times)
        min_response_time = min(response_times)
        percentile_95 = statistics.quantiles(response_times, n=20)[18]  # 95パーセンタイル
    else:
        avg_response_time = median_response_time = max_response_time = min_response_time = percentile_95 = 0

    success_rate = (len(successful_requests) / len(results)) * 100 if results else 0
    throughput = len(results) / total_time

    # 結果表示
    print("\n📊 テスト結果:")
    print(f"- テスト実行時間: {total_time:.2f}秒")
    print(f"- 成功リクエスト: {len(successful_requests)}/{len(results)}")
    print(f"- 成功率: {success_rate:.1f}%")
    print(f"- スループット: {throughput:.1f} req/sec")
    print("\n⏱️  レスポンスタイム統計:")
    print(f"- 平均: {avg_response_time * 1000:.2f}ms")
    print(f"- 中央値: {median_response_time * 1000:.2f}ms")
    print(f"- 最小: {min_response_time * 1000:.2f}ms")
    print(f"- 最大: {max_response_time * 1000:.2f}ms")
    print(f"- 95パーセンタイル: {percentile_95 * 1000:.2f}ms")

    # 性能評価
    print("\n✅ 性能評価:")
    if avg_response_time <= TARGET_RESPONSE_TIME:
        print(f"✅ 平均レスポンスタイム: 目標達成 ({TARGET_RESPONSE_TIME * 1000:.0f}ms以下)")
    else:
        print(f"❌ 平均レスポンスタイム: 目標未達成 (目標: {TARGET_RESPONSE_TIME * 1000:.0f}ms)")

    if success_rate >= 99.9:
        print("✅ エラー率: 目標達成 (0.1%以下)")
    else:
        print(f"❌ エラー率: {100 - success_rate:.2f}% (目標: 0.1%以下)")

    if throughput >= 100:
        print("✅ スループット: 目標達成 (100 req/sec以上)")
    else:
        print(f"⚠️  スループット: {throughput:.1f} req/sec (目標: 100 req/sec)")

    # エラー詳細
    if failed_requests:
        print("\n❌ エラー詳細:")
        for r in failed_requests[:5]:  # 最初の5件のみ表示
            print(f"  - {r.get('error', 'Unknown error')}")

if __name__ == "__main__":
    print("=" * 50)
    print("BUD API 負荷テスト")
    print("=" * 50)
    asyncio.run(run_load_test())
