import { ApiService } from '@/services/apiService';
import { API_CONFIG } from '@/constants/api';

const { ENDPOINTS } = API_CONFIG;

export const voiceApi = {
  // 文字起こし保存
  saveTranscription: async ({
    childId,
    transcription,
  }: {
    childId: string;
    transcription: string;
  }) => {
    try {
      return await ApiService.post(ENDPOINTS.VOICE.TRANSCRIBE, {
        child_id: childId,
        transcript: transcription,
      });
    } catch (error) {
      console.error('❌ 文字起こしエラー:', error);
      throw error;
    }
  },

  // 音声ファイルを文字起こしするAPI
  transcribe: async (audioBlob: Blob, childId: string) => {
    try {
      // 音声ファイルをBase64に変換
      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      const result = await ApiService.post(ENDPOINTS.VOICE.TRANSCRIBE, {
        file: base64Audio,
        child_id: childId,
      });
      
      console.log('✅ 文字起こし成功:', result);
      return result;
    } catch (error) {
      console.error('❌ 文字起こしに失敗:', error);
      throw error;
    }
  },

  // 文字起こし結果取得
  getTranscript: async (transcriptId: string) => {
    try {
      return await ApiService.get(ENDPOINTS.VOICE.TRANSCRIPT(transcriptId));
    } catch (error) {
      console.error('音声認識結果の取得に失敗:', error);
      throw error;
    }
  },

  // 音声履歴取得
  getHistory: async (childId: string) => {
    try {
      return await ApiService.get(ENDPOINTS.VOICE.HISTORY(childId));
    } catch (error) {
      console.error('音声履歴の取得に失敗:', error);
      throw error;
    }
  },

  // チャレンジ詳細取得
  getChallenge: async (challengeId: string) => {
    try {
      return await ApiService.get(ENDPOINTS.VOICE.CHALLENGE(challengeId));
    } catch (error) {
      console.error('チャレンジ詳細の取得に失敗:', error);
      throw error;
    }
  },
};