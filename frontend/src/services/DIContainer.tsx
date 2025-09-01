// 依存性注入コンテナ - テスト可能性とモジュール独立性の向上

import React, { createContext, useContext, ReactNode } from 'react';

// 抽象インターフェース
export interface IApiClient {
  get<T>(endpoint: string): Promise<T>;
  post<T>(endpoint: string, body: Record<string, unknown>): Promise<T>;
  put<T>(endpoint: string, body: Record<string, unknown>): Promise<T>;
  delete<T>(endpoint: string): Promise<T>;
}

export interface IAuthService {
  getHeaders(): Promise<Record<string, string>>;
  getCurrentUser(): Promise<any>;
  isAuthenticated(): boolean;
}

export interface ISpeechRecognition {
  start(): void;
  stop(): void;
  isSupported(): boolean;
  onResult(callback: (transcript: string) => void): void;
  onError(callback: (error: string) => void): void;
}

// 依存性コンテナ
export interface Dependencies {
  apiClient: IApiClient;
  authService: IAuthService;
  speechRecognition: ISpeechRecognition;
}

// React Context
const DIContext = createContext<Dependencies | null>(null);

// Provider コンポーネント
interface DIProviderProps {
  children: ReactNode;
  dependencies: Dependencies;
}

export const DIProvider: React.FC<DIProviderProps> = ({
  children,
  dependencies,
}) => {
  return (
    <DIContext.Provider value={dependencies}>
      {children}
    </DIContext.Provider>
  );
};

// カスタムフック
export const useDI = (): Dependencies => {
  const context = useContext(DIContext);
  if (!context) {
    throw new Error('useDI must be used within a DIProvider');
  }
  return context;
};

// 便利フック
export const useApiClient = (): IApiClient => useDI().apiClient;
export const useAuthService = (): IAuthService => useDI().authService;
export const useSpeechRecognitionService = (): ISpeechRecognition => useDI().speechRecognition;