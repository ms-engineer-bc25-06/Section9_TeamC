import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';

// SpeechRecognition APIのモック
class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = '';
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null = null;
  onresult: ((this: SpeechRecognition, ev: any) => void) | null = null;
  onerror: ((this: SpeechRecognition, ev: any) => void) | null = null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null = null;

  start = vi.fn(() => {
    setTimeout(() => {
      if (this.onstart) {
        this.onstart.call(this as any, new Event('start'));
      }
    }, 0);
  });

  stop = vi.fn(() => {
    setTimeout(() => {
      if (this.onend) {
        this.onend.call(this as any, new Event('end'));
      }
    }, 0);
  });

  abort = vi.fn();
}

describe('useVoiceRecording', () => {
  let mockSpeechRecognition: MockSpeechRecognition;

  beforeEach(() => {
    mockSpeechRecognition = new MockSpeechRecognition();
    (global as any).SpeechRecognition = vi.fn(() => mockSpeechRecognition);
    (global as any).webkitSpeechRecognition = vi.fn(() => mockSpeechRecognition);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('基本的な機能', () => {
    it('初期状態が正しく設定される', () => {
      const { result } = renderHook(() => useVoiceRecording());

      expect(result.current.isListening).toBe(false);
      expect(result.current.transcription).toBe('');
      expect(result.current.isSupported).toBe(true);
    });

    it('SpeechRecognitionがサポートされていない場合', () => {
      delete (global as any).SpeechRecognition;
      delete (global as any).webkitSpeechRecognition;

      const { result } = renderHook(() => useVoiceRecording());

      expect(result.current.isSupported).toBe(false);
    });
  });

  describe('録音の開始と停止', () => {
    it('録音を開始できる', async () => {
      const { result } = renderHook(() => useVoiceRecording());

      await act(async () => {
        result.current.startListening();
      });

      await waitFor(() => {
        expect(mockSpeechRecognition.start).toHaveBeenCalled();
        expect(result.current.isListening).toBe(true);
      });
    });

    it('録音を停止できる', async () => {
      const { result } = renderHook(() => useVoiceRecording());

      await act(async () => {
        result.current.startListening();
      });

      await waitFor(() => {
        expect(result.current.isListening).toBe(true);
      });

      await act(async () => {
        result.current.stopListening();
      });

      await waitFor(() => {
        expect(mockSpeechRecognition.stop).toHaveBeenCalled();
        expect(result.current.isListening).toBe(false);
      });
    });
  });

  describe('音声認識結果の処理', () => {
    it('最終結果を正しく処理する', async () => {
      const { result } = renderHook(() => useVoiceRecording());

      await act(async () => {
        result.current.startListening();
      });

      const mockEvent = {
        resultIndex: 0,
        results: [
          {
            isFinal: true,
            0: { transcript: 'テスト音声', confidence: 0.9 },
            length: 1,
          },
        ],
        length: 1,
      };

      await act(async () => {
        if (mockSpeechRecognition.onresult) {
          mockSpeechRecognition.onresult.call(mockSpeechRecognition as any, mockEvent);
        }
      });

      expect(result.current.transcription).toBe('テスト音声');
    });

    it('中間結果を正しく処理する', async () => {
      const { result } = renderHook(() => useVoiceRecording());

      await act(async () => {
        result.current.startListening();
      });

      const mockEvent = {
        resultIndex: 0,
        results: [
          {
            isFinal: false,
            0: { transcript: 'テスト', confidence: 0.8 },
            length: 1,
          },
        ],
        length: 1,
      };

      await act(async () => {
        if (mockSpeechRecognition.onresult) {
          mockSpeechRecognition.onresult.call(mockSpeechRecognition as any, mockEvent);
        }
      });

      expect(result.current.transcription).toBe(' テスト');
    });

    it('複数の結果を連結する', async () => {
      const { result } = renderHook(() => useVoiceRecording());

      await act(async () => {
        result.current.startListening();
      });

      // 最初の結果
      const firstEvent = {
        resultIndex: 0,
        results: [
          {
            isFinal: true,
            0: { transcript: 'こんにちは', confidence: 0.9 },
            length: 1,
          },
        ],
        length: 1,
      };

      await act(async () => {
        if (mockSpeechRecognition.onresult) {
          mockSpeechRecognition.onresult.call(mockSpeechRecognition as any, firstEvent);
        }
      });

      // 2番目の結果（3秒以内）
      const secondEvent = {
        resultIndex: 1,
        results: [
          { isFinal: true, 0: { transcript: 'こんにちは', confidence: 0.9 }, length: 1 },
          {
            isFinal: true,
            0: { transcript: '世界', confidence: 0.9 },
            length: 1,
          },
        ],
        length: 2,
      };

      await act(async () => {
        if (mockSpeechRecognition.onresult) {
          mockSpeechRecognition.onresult.call(mockSpeechRecognition as any, secondEvent);
        }
      });

      expect(result.current.transcription).toBe('こんにちは世界');
    });
  });

  describe('エラー処理', () => {
    it('エラーが発生した場合に自動的に再開する', async () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useVoiceRecording());

      await act(async () => {
        result.current.startListening();
      });

      const mockError = {
        error: 'network',
        message: 'ネットワークエラー',
      };

      await act(async () => {
        if (mockSpeechRecognition.onerror) {
          mockSpeechRecognition.onerror.call(mockSpeechRecognition as any, mockError);
        }
      });

      // タイマーを進める
      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      // 再開されていることを確認
      expect(mockSpeechRecognition.start).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    it('停止後はエラーが発生しても再開しない', async () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useVoiceRecording());

      await act(async () => {
        result.current.startListening();
      });

      await act(async () => {
        result.current.stopListening();
      });

      const mockError = {
        error: 'network',
        message: 'ネットワークエラー',
      };

      await act(async () => {
        if (mockSpeechRecognition.onerror) {
          mockSpeechRecognition.onerror.call(mockSpeechRecognition as any, mockError);
        }
      });

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      // 再開されていないことを確認
      expect(mockSpeechRecognition.start).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });
  });

  describe('文字起こしのリセット', () => {
    it('文字起こしをリセットできる', async () => {
      const { result } = renderHook(() => useVoiceRecording());

      await act(async () => {
        result.current.startListening();
      });

      const mockEvent = {
        resultIndex: 0,
        results: [
          {
            isFinal: true,
            0: { transcript: 'テスト音声', confidence: 0.9 },
            length: 1,
          },
        ],
        length: 1,
      };

      await act(async () => {
        if (mockSpeechRecognition.onresult) {
          mockSpeechRecognition.onresult.call(mockSpeechRecognition as any, mockEvent);
        }
      });

      expect(result.current.transcription).toBe('テスト音声');

      await act(async () => {
        result.current.resetTranscription();
      });

      expect(result.current.transcription).toBe('');
    });
  });

  describe('継続的な録音', () => {
    it('onendイベント後に自動的に再開する', async () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useVoiceRecording());

      await act(async () => {
        result.current.startListening();
      });

      await act(async () => {
        if (mockSpeechRecognition.onend) {
          mockSpeechRecognition.onend.call(mockSpeechRecognition as any, new Event('end'));
        }
      });

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      // 再開されていることを確認
      expect(mockSpeechRecognition.start).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });
  });

  describe('クリーンアップ', () => {
    it('アンマウント時にクリーンアップされる', async () => {
      const { result, unmount } = renderHook(() => useVoiceRecording());

      await act(async () => {
        result.current.startListening();
      });

      unmount();

      expect(mockSpeechRecognition.stop).toHaveBeenCalled();
    });

    it('ページ離脱時にクリーンアップされる', async () => {
      const { result } = renderHook(() => useVoiceRecording());

      await act(async () => {
        result.current.startListening();
      });

      const beforeUnloadEvent = new Event('beforeunload');
      window.dispatchEvent(beforeUnloadEvent);

      expect(mockSpeechRecognition.stop).toHaveBeenCalled();
    });
  });
});
