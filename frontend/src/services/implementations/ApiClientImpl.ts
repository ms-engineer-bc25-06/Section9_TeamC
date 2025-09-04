// API クライアント実装 - 依存性注入対応

import { IApiClient, IAuthService } from '../DIContainer';
import { API_CONFIG } from '@/constants/api';
import { handleApiError } from '@/utils/error-handler';

export class ApiClientImpl implements IApiClient {
  constructor(private authService: IAuthService) {}

  async request<T>(endpoint: string, method: string, body?: Record<string, unknown>): Promise<T> {
    try {
      const headers = await this.authService.getHeaders();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUTS.DEFAULT);

      const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
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

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, 'GET');
  }

  async post<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
    return this.request<T>(endpoint, 'POST', body);
  }

  async put<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
    return this.request<T>(endpoint, 'PUT', body);
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, 'DELETE');
  }
}
