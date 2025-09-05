import { authApi } from './api/auth';
import { childrenApi } from './api/children';
import { voiceApi } from './api/voice';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
  auth: authApi,

  // 子ども管理API
  children: childrenApi,

  // 音声関連API
  voice: voiceApi,

  // 会話履歴API（音声APIのエイリアス）
  conversations: {
    list: async (childId?: string) => {
      return childId ? voiceApi.getHistory(childId) : [];
    },
    get: async (conversationId: string) => {
      return voiceApi.getTranscript(conversationId);
    },
  },

  // チャレンジAPI
  challenges: {
    delete: async (challengeId: string) => {
      try {
        const { getAuthHeaders } = await import('./api/auth');
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

  // AIフィードバックAPI
  feedback: {
    generate: async (transcriptId: string) => {
      try {
        const { getAuthHeaders } = await import('./api/auth');
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
};
