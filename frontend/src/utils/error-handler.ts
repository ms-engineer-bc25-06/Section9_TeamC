import { ERROR_MESSAGES } from '@/constants/messages';

// エラーハンドリング統一
export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const handleApiError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    // ネットワークエラーの判定
    if (error.message.includes('fetch')) {
      return new AppError(ERROR_MESSAGES.NETWORK.CONNECTION_ERROR, 'NETWORK_ERROR');
    }

    return new AppError(error.message, 'UNKNOWN_ERROR');
  }

  return new AppError(ERROR_MESSAGES.NETWORK.SERVER_ERROR, 'SERVER_ERROR');
};

export const logError = (error: AppError, context?: string) => {
  console.error(`[${context || 'APP'}] ${error.code}: ${error.message}`);
};
