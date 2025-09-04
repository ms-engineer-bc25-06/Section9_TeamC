// API通信の共通処理 - DRY原則に基づく統一化
// OPTIMIZE: レスポンスキャッシュとリクエスト重複防止の実装検討
// TODO: リトライ機能とネットワーク障害時の自動復旧機能追加

import { getAuthHeaders } from '@/lib/api/auth';
import { API_CONFIG } from '@/constants/api';
import { handleApiError } from '@/utils/error-handler';

const { BASE_URL } = API_CONFIG;

export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: Record<string, unknown>;
  timeout?: number;
}

export class ApiService {
  /**
   * 統一されたAPI通信処理
   */
  static async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    try {
      const { method = 'GET', body, timeout = API_CONFIG.TIMEOUTS.DEFAULT } = options;

      const headers = await getAuthHeaders();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { detail: `リクエストに失敗しました(${response.status})` };
        }
        throw handleApiError(new Error(errorData.detail || `API Error: ${response.status}`));
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw handleApiError(new Error('リクエストがタイムアウトしました'));
      }
      throw handleApiError(error);
    }
  }

  static async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  static async post<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body });
  }

  static async put<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body });
  }

  static async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}
