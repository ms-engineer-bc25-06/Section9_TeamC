// APIService ユニットテスト - DRY原則に基づく共通処理のテスト

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiService } from '@/services/apiService';

// getAuthHeaders をモック化
vi.mock('@/lib/api/auth', () => ({
  getAuthHeaders: vi.fn().mockResolvedValue({
    'Content-Type': 'application/json',
    Authorization: 'Bearer mock-token',
  }),
}));

// fetch をモック化
global.fetch = vi.fn();

describe('ApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('get', () => {
    it('正常なGETリクエストを送信できる', async () => {
      const mockResponse = { id: '1', name: 'test' };
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await ApiService.get('/test-endpoint');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/test-endpoint',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-token',
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('エラーレスポンスを適切に処理する', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: vi.fn().mockResolvedValueOnce({ detail: 'Not found' }),
      });

      await expect(ApiService.get('/test-endpoint')).rejects.toThrow();
    });
  });

  describe('post', () => {
    it('正常なPOSTリクエストを送信できる', async () => {
      const mockResponse = { success: true };
      const requestBody = { name: 'test' };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await ApiService.post('/test-endpoint', requestBody);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/test-endpoint',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestBody),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('timeout handling', () => {
    it('タイムアウトエラーを適切に処理する', async () => {
      vi.useFakeTimers();

      // fetch が永続的に pending になるようモック
      (fetch as any).mockImplementationOnce(
        () => new Promise(() => {}) // 永続的に pending
      );

      const requestPromise = ApiService.get('/test-endpoint');

      // タイムアウト時間を進める
      vi.advanceTimersByTime(11000);

      await expect(requestPromise).rejects.toThrow('リクエストがタイムアウトしました');

      vi.useRealTimers();
    });
  });
});
