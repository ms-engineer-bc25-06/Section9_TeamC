// NOTE: 旧API実装 - 新しいApiServiceとDIContainerに移行済み
// TODO: このファイルは削除予定（互換性確認後）
// DEPRECATED: 新規開発では /services/apiService.ts を使用

const API_URL = 'http://localhost:8000';

/**
 * Firebase認証ヘッダーを取得
 * @returns 認証ヘッダー
 */
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
      const response = await fetch(`${API_URL}/health`);
      return response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      return { status: 'error' };
    }
  },

  // 認証関連API
  auth: {
    /**
     * Firebase認証後のバックエンド連携
     */
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
        const response = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            idToken: idToken,
          }),
        });

        console.log('🚀 api.auth.login: fetchレスポンス受信', res.status, res.statusText);

        if (!response.ok) {
          const errorData = await response.json();
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

        return await res.json();
      } catch (error) {
        console.error('プロフィール取得に失敗:', error);
        throw error;
      }
    },

    // プロフィール更新
    updateProfile: async (profileData: { full_name?: string; username?: string; bio?: string }) => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/api/auth/profile`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(profileData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'プロフィール更新に失敗しました');
        }

        return await res.json();
      } catch (error) {
        console.error('プロフィール更新に失敗:', error);
        throw error;
      }
    },

    // 認証済み子ども一覧取得
    getChildren: async () => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/api/auth/children`, {
          method: 'GET',
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || '子ども一覧取得に失敗しました');
        }

        return await res.json();
      } catch (error) {
        console.error('認証済み子ども一覧取得に失敗:', error);
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

        return await res.json();
      } catch (error) {
        console.error('認証テストに失敗:', error);
        throw error;
      }
    },
  },

  // 子ども管理API
  children: {
    // 子ども一覧取得
    list: async () => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/api/children`, {
          method: 'GET',
          headers,
        });
        if (!response.ok) throw new Error('Failed to fetch children');
        return response.json();
      } catch (error) {
        console.error('子ども一覧の取得に失敗:', error);
        return [];
      }
    },

    // 子ども登録
    create: async (data: { name: string; nickname?: string; birthdate?: string }) => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/api/children`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            nickname: data.name,
            birthdate: data.birthdate,
          }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to create child');
        }
        return response.json();
      } catch (error) {
        console.error('子どもの登録に失敗:', error);
        throw error;
      }
    },

    // 子ども詳細取得
    get: async (childId: string) => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/api/children/${childId}`, {
          method: 'GET',
          headers,
        });
        if (!response.ok) throw new Error('Failed to fetch child');
        return response.json();
      } catch (error) {
        console.error('子ども情報の取得に失敗:', error);
        throw error;
      }
    },

    // 子ども情報更新
    update: async (
      childId: string,
      data: { name?: string; nickname?: string; birthdate?: string }
    ) => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/api/children/${childId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            nickname: data.name || data.nickname,
            birthdate: data.birthdate,
          }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to update child');
        }
        return response.json();
      } catch (error) {
        console.error('子ども情報の更新に失敗:', error);
        throw error;
      }
    },

    // 子ども削除
    delete: async (childId: string) => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/api/children/${childId}`, {
          method: 'DELETE',
          headers,
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to delete child');
        }
        return response.json();
      } catch (error) {
        console.error('子ども情報の削除に失敗:', error);
        throw error;
      }
    },
  },

  // 音声認識API
  voice: {
    // 文字起こし保存
    saveTranscription: async ({
      childId,
      transcription,
    }: {
      childId: string;
      transcription: string;
    }) => {
      const headers = await getAuthHeaders();

      const response = await fetch(`${API_URL}/api/voice/transcribe`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          child_id: childId,
          transcript: transcription,
        }),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await res.json();
        } catch {
          // JSON形式でない場合のフォールバック
          errorData = { detail: `保存に失敗しました(${res.status})` };
        }
        console.error('❌ 文字起こしエラー詳細:', errorData);
        throw new Error(errorData.detail || `保存に失敗しました(${response.status})`);
      }

      return response.json();
    },

    // 音声ファイルを文字起こしするAPI（修正版：child_idをクエリパラメータとして送信）
    transcribe: async (audioBlob: Blob, childId: string) => {
      try {
        const headers = await getAuthHeaders();

        // 音声ファイルをBase64に変換
        const base64Audio = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(audioBlob);
        });

        const response = await fetch(`${API_URL}/api/voice/transcribe`, {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ file: base64Audio, child_id: childId }),
        });

        if (!response.ok) {
          let errorData;
          try {
            errorData = await res.json();
          } catch {
            // JSON形式でない場合のフォールバック
            errorData = { detail: `文字起こしに失敗しました(${res.status})` };
          }
          console.error('❌ 文字起こしエラー詳細:', errorData);
          throw new Error(errorData.detail || `文字起こしに失敗しました(${response.status})`);
        }

        const result = await res.json();
        console.log('✅ 文字起こし成功:', result);
        return result;
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error('❌ 文字起こしに失敗:', error.message);
        } else {
          console.error('❌ 文字起こしに失敗:', error);
        }
        throw error;
      }
    },

    // 文字起こし結果取得
    getTranscript: async (transcriptId: string) => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/api/voice/transcript/${transcriptId}`, {
          method: 'GET',
          headers,
        });

        if (!response.ok) {
          let errorData;
          try {
            errorData = await res.json();
          } catch {
            // JSON形式でない場合のフォールバック
            errorData = { detail: '音声認識結果の取得に失敗しました' };
          }
          throw new Error(errorData.detail || '音声認識結果の取得に失敗しました');
        }

        return response.json();
      } catch (error) {
        console.error('音声認識結果の取得に失敗:', error);
        throw error;
      }
    },

    // 音声履歴取得
    getHistory: async (childId: string) => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/api/voice/history/${childId}`, {
          method: 'GET',
          headers,
        });

        if (!response.ok) {
          let errorData;
          try {
            errorData = await res.json();
          } catch {
            // JSON形式でない場合のフォールバック
            errorData = { detail: '音声履歴の取得に失敗しました' };
          }
          throw new Error(errorData.detail || '音声履歴の取得に失敗しました');
        }

        return response.json();
      } catch (error) {
        console.error('音声履歴の取得に失敗:', error);
        throw error;
      }
    },

    // チャレンジ詳細取得
    getChallenge: async (challengeId: string) => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/api/voice/challenge/${challengeId}`, {
          method: 'GET',
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'チャレンジ詳細の取得に失敗しました');
        }

        return response.json();
      } catch (error) {
        console.error('チャレンジ詳細の取得に失敗:', error);
        throw error;
      }
    },
  },

  // 会話履歴API
  conversations: {
    // 会話履歴一覧取得
    list: async (childId?: string) => {
      try {
        const headers = await getAuthHeaders();
        const url = childId
          ? `${API_URL}/api/voice/history/${childId}`
          : `${API_URL}/conversations`;

        const response = await fetch(url, {
          method: 'GET',
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || '会話履歴の取得に失敗しました');
        }

        return response.json();
      } catch (error) {
        console.error('会話履歴の取得に失敗:', error);
        throw error;
      }
    },

    // 会話詳細取得
    get: async (conversationId: string) => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/api/voice/transcript/${conversationId}`, {
          method: 'GET',
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || '会話詳細の取得に失敗しました');
        }

        return response.json();
      } catch (error) {
        console.error('会話詳細の取得に失敗:', error);
        throw error;
      }
    },
  },

  // AIフィードバックAPI
  feedback: {
    // フィードバック生成
    generate: async (transcriptId: string) => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/api/voice/transcript/${transcriptId}`, {
          method: 'GET',
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'フィードバック取得に失敗しました');
        }

        return response.json();
      } catch (error) {
        console.error('フィードバック取得に失敗:', error);
        throw error;
      }
    },
  },

  // チャレンジAPI
  challenges: {
    // チャレンジ削除
    delete: async (challengeId: string) => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/api/ai-feedback/${challengeId}`, {
          method: 'DELETE',
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to delete challenge');
        }

        return response.json();
      } catch (error) {
        console.error('チャレンジ記録の削除に失敗:', error);
        throw error;
      }
    },
  },
};
