import { getAuthHeaders } from './auth';

const API_URL = 'http://localhost:8000';

export const voiceApi = {
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
        errorData = await response.json();
      } catch {
        // JSON形式でない場合のフォールバック
        errorData = { detail: `保存に失敗しました(${response.status})` };
      }
      console.error('❌ 文字起こしエラー詳細:', errorData);
      throw new Error(errorData.detail || `保存に失敗しました(${response.status})`);
    }

    return response.json();
  },

  // 音声ファイルを文字起こしするAPI
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
          errorData = await response.json();
        } catch {
          // JSON形式でない場合のフォールバック
          errorData = { detail: `文字起こしに失敗しました(${response.status})` };
        }
        console.error('❌ 文字起こしエラー詳細:', errorData);
        throw new Error(errorData.detail || `文字起こしに失敗しました(${response.status})`);
      }

      const result = await response.json();
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
          errorData = await response.json();
        } catch {
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
          errorData = await response.json();
        } catch {
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
};