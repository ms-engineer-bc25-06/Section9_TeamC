const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';

// Firebase認証トークンを取得するヘルパー関数（デバッグ強化版）
const getAuthHeaders = async (): Promise<Record<string, string>> => {
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

export const api = {
  // ヘルスチェック
  health: async () => {
    try {
      const res = await fetch(`${API_URL}/health`);
      return res.json();
    } catch (error) {
      console.error('Health check failed:', error);
      return { status: 'error' };
    }
  },

  // 🔐 認証関連API
  auth: {
    // Firebase認証後のバックエンド連携（デバッグ強化版）
    login: async () => {
      try {
        console.log('🚀 api.auth.login: 開始');
        console.log('🚀 api.auth.login: API_URL', API_URL);

        const headers = await getAuthHeaders();
        console.log('🚀 api.auth.login: ヘッダー取得完了', headers);

        console.log('🚀 api.auth.login: fetchリクエスト開始');
        const res = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers,
        });

        console.log('🚀 api.auth.login: fetchレスポンス受信', res.status, res.statusText);

        if (!res.ok) {
          const errorData = await res.json();
          console.log('❌ api.auth.login: レスポンスエラー', errorData);
          throw new Error(errorData.detail || 'ログイン処理に失敗しました');
        }

        const result = await res.json();
        console.log('✅ api.auth.login: 成功', result);
        return result;
      } catch (error) {
        console.error('❌ api.auth.login: エラー発生', error);
        throw error;
      }
    },

    // その他の認証関連API（既存のまま）
    getProfile: async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_URL}/auth/profile`, {
          method: 'GET',
          headers,
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.detail || 'プロフィール取得に失敗しました');
        }

        return await res.json();
      } catch (error) {
        console.error('プロフィール取得に失敗:', error);
        throw error;
      }
    },

    updateProfile: async (profileData: { full_name?: string; username?: string; bio?: string }) => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_URL}/auth/profile`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(profileData),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.detail || 'プロフィール更新に失敗しました');
        }

        return await res.json();
      } catch (error) {
        console.error('プロフィール更新に失敗:', error);
        throw error;
      }
    },

    getChildren: async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_URL}/auth/children`, {
          method: 'GET',
          headers,
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.detail || '子ども一覧取得に失敗しました');
        }

        return await res.json();
      } catch (error) {
        console.error('認証済み子ども一覧取得に失敗:', error);
        throw error;
      }
    },

    test: async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_URL}/auth/test`, {
          method: 'GET',
          headers,
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.detail || '認証テストに失敗しました');
        }

        return await res.json();
      } catch (error) {
        console.error('認証テストに失敗:', error);
        throw error;
      }
    },
  },

  // 子ども管理（既存）
  children: {
    list: async () => {
      try {
        const res = await fetch(`${API_URL}/children`);
        if (!res.ok) throw new Error('Failed to fetch children');
        return res.json();
      } catch (error) {
        console.error('子ども一覧の取得に失敗:', error);
        return [];
      }
    },

    create: async (data: { name: string; birthdate: string }) => {
      try {
        const res = await fetch(`${API_URL}/children`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to create child');
        return res.json();
      } catch (error) {
        console.error('子どもの登録に失敗:', error);
        throw error;
      }
    },
  },
};
