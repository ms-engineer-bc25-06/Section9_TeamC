const API_URL = 'http://localhost:8000';

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
    // Firebase認証後のバックエンド連携（修正版）
    login: async () => {
      try {
        console.log('🚀 api.auth.login: 開始');
        console.log('🚀 api.auth.login: API_URL', API_URL);

        // Firebase IDトークンを取得
        const { getAuth } = await import('firebase/auth');
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
          throw new Error('ユーザーが認証されていません');
        }

        const idToken = await user.getIdToken();
        console.log(
          '🚀 api.auth.login: IDトークン取得完了',
          idToken ? `${idToken.substring(0, 20)}...` : 'null'
        );

        console.log('🚀 api.auth.login: fetchリクエスト開始');
        const res = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            idToken: idToken,
          }),
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
        const res = await fetch(`${API_URL}/api/auth/profile`, {
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
        const res = await fetch(`${API_URL}/api/auth/profile`, {
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
        const res = await fetch(`${API_URL}/api/auth/children`, {
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
        const res = await fetch(`${API_URL}/api/auth/test`, {
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

  // 子ども管理API
  children: {
    list: async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_URL}/api/children`, {
          method: 'GET',
          headers,
        });
        if (!res.ok) throw new Error('Failed to fetch children');
        return res.json();
      } catch (error) {
        console.error('子ども一覧の取得に失敗:', error);
        return [];
      }
    },

    create: async (data: { name: string; nickname?: string; birthdate?: string }) => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_URL}/api/children`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            nickname: data.name, // nameをnicknameとして送信
            birth_date: data.birthdate,  // birthdateをbirth_dateとして送信
          }),
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.detail || 'Failed to create child');
        }
        return res.json();
      } catch (error) {
        console.error('子どもの登録に失敗:', error);
        throw error;
      }
    },

    get: async (childId: string) => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_URL}/api/children/${childId}`, {
          method: 'GET',
          headers,
        });
        if (!res.ok) throw new Error('Failed to fetch child');
        return res.json();
      } catch (error) {
        console.error('子ども情報の取得に失敗:', error);
        throw error;
      }
    },

    update: async (
      childId: string,
      data: { name?: string; nickname?: string; birthdate?: string }
    ) => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_URL}/api/children/${childId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            nickname: data.name || data.nickname,
            birth_date: data.birthdate,  // birthdateをbirth_dateとして送信
          }),
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.detail || 'Failed to update child');
        }
        return res.json();
      } catch (error) {
        console.error('子ども情報の更新に失敗:', error);
        throw error;
      }
    },

    delete: async (childId: string) => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_URL}/api/children/${childId}`, {
          method: 'DELETE',
          headers,
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.detail || 'Failed to delete child');
        }
        return res.json();
      } catch (error) {
        console.error('子ども情報の削除に失敗:', error);
        throw error;
      }
    },
  },

  // 🎤 音声文字起こしAPI
  voice: {
    // 音声ファイルを文字起こしするAPI（修正版：child_idをクエリパラメータとして送信）
    transcribe: async (audioBlob: Blob, childId: string) => {
      try {
        console.log('🎤 音声文字起こし開始:', { childId, blobSize: audioBlob.size });
        
        // childIdが存在することを確認
        if (!childId) {
          throw new Error('child_idが指定されていません');
        }
        
        // 認証ヘッダーを取得（Content-Typeは削除してFormDataに任せる）
        const headers = await getAuthHeaders();
        delete headers['Content-Type'];

        // FormDataを作成して音声ファイルを追加
        const formData = new FormData();
        formData.append('file', audioBlob, 'recording.webm');

        // child_idをクエリパラメータとして確実に追加
        const url = `${API_URL}/api/voice/transcribe?child_id=${encodeURIComponent(childId)}`;
        console.log('🎤 リクエストURL:', url);
        console.log('🎤 child_id:', childId);

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            ...headers,
          },
          body: formData,
        });

        console.log('🎤 レスポンス受信:', res.status, res.statusText);

        if (!res.ok) {
          const errorData = await res.json();
          console.error('❌ 文字起こしエラー詳細:', errorData);
          throw new Error(errorData.detail || `文字起こしに失敗しました(${res.status})`);
        }

        const result = await res.json();
        console.log('✅ 文字起こし成功:', result);
        return result;
      } catch (error) {
        console.error('❌ 文字起こしに失敗:', error);
        throw error;
      }
    },

    getTranscript: async (transcriptId: string) => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_URL}/api/voice/transcript/${transcriptId}`, {
          method: 'GET',
          headers,
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.detail || '音声認識結果の取得に失敗しました');
        }

        return res.json();
      } catch (error) {
        console.error('音声認識結果の取得に失敗:', error);
        throw error;
      }
    },

    getHistory: async (childId: string) => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_URL}/api/voice/history/${childId}`, {
          method: 'GET',
          headers,
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.detail || '音声履歴の取得に失敗しました');
        }

        return res.json();
      } catch (error) {
        console.error('音声履歴の取得に失敗:', error);
        throw error;
      }
    },
  },

  // 💬 会話履歴API
  conversations: {
    list: async (childId?: string) => {
      try {
        const headers = await getAuthHeaders();
        const url = childId
          ? `${API_URL}/api/voice/history/${childId}`
          : `${API_URL}/conversations`;

        const res = await fetch(url, {
          method: 'GET',
          headers,
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.detail || '会話履歴の取得に失敗しました');
        }

        return res.json();
      } catch (error) {
        console.error('会話履歴の取得に失敗:', error);
        throw error;
      }
    },

    get: async (conversationId: string) => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_URL}/api/voice/transcript/${conversationId}`, {
          method: 'GET',
          headers,
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.detail || '会話詳細の取得に失敗しました');
        }

        return res.json();
      } catch (error) {
        console.error('会話詳細の取得に失敗:', error);
        throw error;
      }
    },
  },

  // 🤖 AIフィードバックAPI
  feedback: {
    generate: async (transcriptId: string) => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_URL}/api/voice/transcript/${transcriptId}`, {
          method: 'GET',
          headers,
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.detail || 'フィードバック取得に失敗しました');
        }

        return res.json();
      } catch (error) {
        console.error('フィードバック取得に失敗:', error);
        throw error;
      }
    },
  },
};