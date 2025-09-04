// 依存性注入テスト - モック可能性の検証

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  DIProvider,
  useDI,
  IApiClient,
  IAuthService,
  ISpeechRecognition,
} from '@/services/DIContainer';

// モックの実装
const mockApiClient: IApiClient = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};

const mockAuthService: IAuthService = {
  getHeaders: vi.fn().mockResolvedValue({}),
  getCurrentUser: vi.fn().mockResolvedValue(null),
  isAuthenticated: vi.fn().mockReturnValue(false),
};

const mockSpeechRecognition: ISpeechRecognition = {
  start: vi.fn(),
  stop: vi.fn(),
  isSupported: vi.fn().mockReturnValue(true),
  onResult: vi.fn(),
  onError: vi.fn(),
};

// テスト用コンポーネント
const TestComponent = () => {
  const { apiClient, authService, speechRecognition } = useDI();

  return (
    <div>
      <button onClick={() => apiClient.get('/test')}>API Test</button>
      <button onClick={() => authService.getCurrentUser()}>Auth Test</button>
      <button onClick={() => speechRecognition.start()}>Speech Test</button>
    </div>
  );
};

describe('依存性注入コンテナ', () => {
  const dependencies = {
    apiClient: mockApiClient,
    authService: mockAuthService,
    speechRecognition: mockSpeechRecognition,
  };

  it('依存性が正しく注入される', () => {
    render(
      <DIProvider dependencies={dependencies}>
        <TestComponent />
      </DIProvider>
    );

    expect(screen.getByText('API Test')).toBeInTheDocument();
    expect(screen.getByText('Auth Test')).toBeInTheDocument();
    expect(screen.getByText('Speech Test')).toBeInTheDocument();
  });

  it('Provider外でのuseDI使用時はエラーを投げる', () => {
    // エラーログを抑制
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useDI must be used within a DIProvider');

    consoleSpy.mockRestore();
  });

  it('各サービスが個別に利用可能', async () => {
    const { result } = renderHook(() => useDI(), {
      wrapper: ({ children }) => <DIProvider dependencies={dependencies}>{children}</DIProvider>,
    });

    expect(result.current.apiClient).toBe(mockApiClient);
    expect(result.current.authService).toBe(mockAuthService);
    expect(result.current.speechRecognition).toBe(mockSpeechRecognition);
  });
});
