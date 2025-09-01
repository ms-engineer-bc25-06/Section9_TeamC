const API_URL = 'http://localhost:8000';

/**
 * Firebase認証ヘッダーを取得
 * @returns 認証ヘッダー
 */
export const getAuthHeaders = async (): Promise<Record<string, string>> => {
  try {
    console.log('🔍 getAuthHeaders: 開始');

    // Firebase Authからトークンを取得
    const { getAuth } = await import('firebase/auth');
    console.log('🔍 getAuthHeaders: firebase/auth インポート完了');

    const auth = getAuth();
    console.log('🔍 getAuthHeaders: auth取得完了', auth);

    const user = auth.currentUser;
    console.log('🔍 getAuthHeaders: currentUser', user);

    if (user) {
      console.log('🔍 getAuthHeaders: ユーザー存在、トークン取得開始');
      const token = await user.getIdToken();
      console.log(
        '🔍 getAuthHeaders: トークン取得完了',
        token ? `${token.substring(0, 20)}...` : 'null'
      );

      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };
      console.log('🔍 getAuthHeaders: ヘッダー作成完了', headers);
      return headers;
    }

    console.log('⚠️ getAuthHeaders: ユーザーが存在しません');
    return { 'Content-Type': 'application/json' };
  } catch (error) {
    console.error('❌ getAuthHeaders: エラー発生', error);
    return { 'Content-Type': 'application/json' };
  }
};

export const authApi = {
  /**
   * Firebase認証後のバックエンド連携
   */
  login: async () => {
    try {
      console.log('🚀 authApi.login: 開始');

      // Firebase IDトークンを取得
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error('ユーザーが認証されていません');
      }

      const idToken = await user.getIdToken();
      console.log(
        '🚀 authApi.login: IDトークン取得完了',
        idToken ? `${idToken.substring(0, 20)}...` : 'null'
      );

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken: idToken,
        }),
      });

      console.log('🚀 authApi.login: fetchレスポンス受信', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('❌ authApi.login: レスポンスエラー', errorData);
        throw new Error(errorData.detail || 'ログイン処理に失敗しました');
      }

      const result = await response.json();
      console.log('✅ authApi.login: 成功', result);
      return result;
    } catch (error) {
      console.error('❌ authApi.login: エラー発生', error);
      throw error;
    }
  },

  // プロフィール取得
  getProfile: async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/api/auth/profile`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'プロフィール取得に失敗しました');
      }

      return await response.json();
    } catch (error) {
      console.error('プロフィール取得に失敗:', error);
      throw error;
    }
  },

  // 認証テスト
  test: async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/api/auth/test`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '認証テストに失敗しました');
      }

      return await response.json();
    } catch (error) {
      console.error('認証テストに失敗:', error);
      throw error;
    }
  },
};