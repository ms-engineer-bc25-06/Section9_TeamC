import { API_CONFIG } from '@/constants/api';
import { UI_CONFIG } from '@/constants/ui';
import { ERROR_MESSAGES } from '@/constants/messages';
import { handleApiError } from '@/utils/error-handler';
import { logger } from '@/utils/logger';

const { BASE_URL, ENDPOINTS } = API_CONFIG;

export const getAuthHeaders = async (): Promise<Record<string, string>> => {
  try {
    logger.debug('getAuthHeaders: 開始');

    const { getAuth } = await import('firebase/auth');
    logger.debug('getAuthHeaders: firebase/auth インポート完了');

    const auth = getAuth();
    logger.debug('getAuthHeaders: auth取得完了', auth);

    const user = auth.currentUser;
    logger.debug('getAuthHeaders: currentUser', user);

    if (user) {
      logger.debug('getAuthHeaders: ユーザー存在、トークン取得開始');
      const token = await user.getIdToken();
      logger.debug(
        'getAuthHeaders: トークン取得完了',
        token ? `${token.substring(0, UI_CONFIG.TOKEN_PREVIEW_LENGTH)}...` : 'null'
      );

      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };
      logger.debug('getAuthHeaders: ヘッダー作成完了', headers);
      return headers;
    }

    logger.debug('getAuthHeaders: ユーザーが存在しません');
    return { 'Content-Type': 'application/json' };
  } catch (error) {
    logger.error('getAuthHeaders: エラー発生', error);
    return { 'Content-Type': 'application/json' };
  }
};

export const authApi = {
  /**
   * Firebase認証後のバックエンド連携
   */
  login: async () => {
    try {
      logger.debug('authApi.login: 開始');

      // Firebase IDトークンを取得
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error('ユーザーが認証されていません');
      }

      const idToken = await user.getIdToken();
      logger.debug(
        'authApi.login: IDトークン取得完了',
        idToken ? `${idToken.substring(0, UI_CONFIG.TOKEN_PREVIEW_LENGTH)}...` : 'null'
      );

      const response = await fetch(`${BASE_URL}${ENDPOINTS.AUTH.LOGIN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken: idToken,
        }),
      });

      logger.debug('authApi.login: fetchレスポンス受信', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        logger.debug('❌ authApi.login: レスポンスエラー', errorData);
        throw new Error(errorData.detail || 'ログイン処理に失敗しました');
      }

      const result = await response.json();
      logger.debug('authApi.login: 成功', result);
      return result;
    } catch (error) {
      logger.error('❌ authApi.login: エラー発生', error);
      throw error;
    }
  },

  // プロフィール取得
  getProfile: async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${BASE_URL}${ENDPOINTS.AUTH.PROFILE}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'プロフィール取得に失敗しました');
      }

      return await response.json();
    } catch (error) {
      logger.error('プロフィール取得に失敗:', error);
      throw error;
    }
  },

  // 認証テスト
  test: async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${BASE_URL}${ENDPOINTS.AUTH.TEST}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '認証テストに失敗しました');
      }

      return await response.json();
    } catch (error) {
      logger.error('認証テストに失敗:', error);
      throw error;
    }
  },
};
