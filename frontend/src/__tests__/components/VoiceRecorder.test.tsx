import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VoiceRecorder } from '@/components/challenge/VoiceRecorder';
import * as speechHook from '@/hooks/useSpeechRecognition';

// useSpeechRecognitionのモック
vi.mock('@/hooks/useSpeechRecognition');

describe('VoiceRecorder - UI操作テスト', () => {
  const mockOnTranscriptionSave = vi.fn();
  const mockUseSpeechRecognition = vi.spyOn(speechHook, 'useSpeechRecognition');

  const defaultMockReturn = {
    isListening: false,
    transcription: '',
    isProcessing: false,
    isSupported: true,
    startListening: vi.fn(),
    stopListening: vi.fn(),
    resetTranscription: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSpeechRecognition.mockReturnValue(defaultMockReturn);
  });

  describe('初期表示', () => {
    it('録音ボタンが表示される', () => {
      render(<VoiceRecorder onTranscriptionSave={mockOnTranscriptionSave} />);

      const recordButton = screen.getByRole('button', { name: /録音開始/i });
      expect(recordButton).toBeInTheDocument();
      expect(recordButton).not.toBeDisabled();
    });

    it('保存ボタンは初期状態では表示されない', () => {
      render(<VoiceRecorder onTranscriptionSave={mockOnTranscriptionSave} />);

      const saveButton = screen.queryByRole('button', { name: /保存/i });
      expect(saveButton).not.toBeInTheDocument();
    });

    it('ブラウザが非対応の場合、エラーメッセージが表示される', () => {
      mockUseSpeechRecognition.mockReturnValue({
        ...defaultMockReturn,
        isSupported: false,
      });

      render(<VoiceRecorder onTranscriptionSave={mockOnTranscriptionSave} />);

      expect(screen.getByText(/このブラウザは音声認識をサポートしていません/i)).toBeInTheDocument();
    });
  });

  describe('録音操作', () => {
    it('録音開始ボタンをクリックすると録音が開始される', async () => {
      const startListening = vi.fn();
      mockUseSpeechRecognition.mockReturnValue({
        ...defaultMockReturn,
        startListening,
      });

      render(<VoiceRecorder onTranscriptionSave={mockOnTranscriptionSave} />);

      const recordButton = screen.getByRole('button', { name: /録音開始/i });
      await userEvent.click(recordButton);

      expect(startListening).toHaveBeenCalledTimes(1);
    });

    it('録音中は停止ボタンが表示される', () => {
      mockUseSpeechRecognition.mockReturnValue({
        ...defaultMockReturn,
        isListening: true,
      });

      render(<VoiceRecorder onTranscriptionSave={mockOnTranscriptionSave} />);

      const stopButton = screen.getByRole('button', { name: /停止/i });
      expect(stopButton).toBeInTheDocument();
      expect(stopButton).toHaveClass('destructive');
    });

    it('停止ボタンをクリックすると録音が停止される', async () => {
      const stopListening = vi.fn();
      mockUseSpeechRecognition.mockReturnValue({
        ...defaultMockReturn,
        isListening: true,
        stopListening,
      });

      render(<VoiceRecorder onTranscriptionSave={mockOnTranscriptionSave} />);

      const stopButton = screen.getByRole('button', { name: /停止/i });
      await userEvent.click(stopButton);

      expect(stopListening).toHaveBeenCalledTimes(1);
    });

    it('処理中は準備中と表示される', () => {
      mockUseSpeechRecognition.mockReturnValue({
        ...defaultMockReturn,
        isProcessing: true,
      });

      render(<VoiceRecorder onTranscriptionSave={mockOnTranscriptionSave} />);

      expect(screen.getByRole('button', { name: /準備中/i })).toBeInTheDocument();
    });

    it('disabledプロパティが設定されている場合、ボタンが無効になる', () => {
      render(<VoiceRecorder onTranscriptionSave={mockOnTranscriptionSave} disabled={true} />);

      const recordButton = screen.getByRole('button', { name: /録音開始/i });
      expect(recordButton).toBeDisabled();
    });
  });

  describe('文字起こし表示', () => {
    it('文字起こし結果が表示される', () => {
      const transcriptionText = 'これはテスト音声です';
      mockUseSpeechRecognition.mockReturnValue({
        ...defaultMockReturn,
        transcription: transcriptionText,
      });

      render(<VoiceRecorder onTranscriptionSave={mockOnTranscriptionSave} />);

      expect(screen.getByText(/認識された音声:/i)).toBeInTheDocument();
      expect(screen.getByText(transcriptionText)).toBeInTheDocument();
    });

    it('文字起こしがある場合、保存ボタンが表示される', () => {
      mockUseSpeechRecognition.mockReturnValue({
        ...defaultMockReturn,
        transcription: 'テスト音声',
      });

      render(<VoiceRecorder onTranscriptionSave={mockOnTranscriptionSave} />);

      const saveButton = screen.getByRole('button', { name: /保存/i });
      expect(saveButton).toBeInTheDocument();
      expect(saveButton).not.toBeDisabled();
    });

    it('空白のみの文字起こしの場合、保存ボタンは無効になる', () => {
      mockUseSpeechRecognition.mockReturnValue({
        ...defaultMockReturn,
        transcription: '   ',
      });

      render(<VoiceRecorder onTranscriptionSave={mockOnTranscriptionSave} />);

      const saveButton = screen.getByRole('button', { name: /保存/i });
      expect(saveButton).toBeDisabled();
    });

    it('改行を含む文字起こしが正しく表示される', () => {
      const multilineText = '最初の行\n\n次の行';
      mockUseSpeechRecognition.mockReturnValue({
        ...defaultMockReturn,
        transcription: multilineText,
      });

      render(<VoiceRecorder onTranscriptionSave={mockOnTranscriptionSave} />);

      const transcriptionElement = screen.getByText(multilineText);
      expect(transcriptionElement).toHaveClass('whitespace-pre-wrap');
    });
  });

  describe('保存機能', () => {
    it('保存ボタンをクリックすると保存処理が実行される', async () => {
      const resetTranscription = vi.fn();
      const transcriptionText = 'テスト音声';

      mockUseSpeechRecognition.mockReturnValue({
        ...defaultMockReturn,
        transcription: transcriptionText,
        resetTranscription,
      });

      render(<VoiceRecorder onTranscriptionSave={mockOnTranscriptionSave} />);

      const saveButton = screen.getByRole('button', { name: /保存/i });
      await userEvent.click(saveButton);

      expect(mockOnTranscriptionSave).toHaveBeenCalledWith(transcriptionText);
      await waitFor(() => {
        expect(resetTranscription).toHaveBeenCalled();
      });
    });

    it('保存処理がPromiseを返す場合も正しく処理される', async () => {
      const resetTranscription = vi.fn();
      const transcriptionText = 'テスト音声';
      const savePromise = vi.fn().mockResolvedValue(undefined);

      mockUseSpeechRecognition.mockReturnValue({
        ...defaultMockReturn,
        transcription: transcriptionText,
        resetTranscription,
      });

      render(<VoiceRecorder onTranscriptionSave={savePromise} />);

      const saveButton = screen.getByRole('button', { name: /保存/i });
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(savePromise).toHaveBeenCalledWith(transcriptionText);
        expect(resetTranscription).toHaveBeenCalled();
      });
    });
  });

  describe('録音状態表示', () => {
    it('録音中は赤い点滅インジケーターが表示される', () => {
      mockUseSpeechRecognition.mockReturnValue({
        ...defaultMockReturn,
        isListening: true,
      });

      render(<VoiceRecorder onTranscriptionSave={mockOnTranscriptionSave} />);

      const indicator = screen.getByText(/録音中.../i);
      expect(indicator).toBeInTheDocument();

      const pulsingDot = indicator.previousElementSibling;
      expect(pulsingDot).toHaveClass('animate-pulse');
      expect(pulsingDot).toHaveClass('bg-red-500');
    });

    it('録音停止時はインジケーターが表示されない', () => {
      mockUseSpeechRecognition.mockReturnValue({
        ...defaultMockReturn,
        isListening: false,
      });

      render(<VoiceRecorder onTranscriptionSave={mockOnTranscriptionSave} />);

      const indicator = screen.queryByText(/録音中.../i);
      expect(indicator).not.toBeInTheDocument();
    });
  });

  describe('アイコン表示', () => {
    it('録音ボタンにマイクアイコンが表示される', () => {
      render(<VoiceRecorder onTranscriptionSave={mockOnTranscriptionSave} />);

      const button = screen.getByRole('button', { name: /録音開始/i });
      const icon = button.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('保存ボタンに保存アイコンが表示される', () => {
      mockUseSpeechRecognition.mockReturnValue({
        ...defaultMockReturn,
        transcription: 'テスト',
      });

      render(<VoiceRecorder onTranscriptionSave={mockOnTranscriptionSave} />);

      const saveButton = screen.getByRole('button', { name: /保存/i });
      const icon = saveButton.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('文字起こし結果にボリュームアイコンが表示される', () => {
      mockUseSpeechRecognition.mockReturnValue({
        ...defaultMockReturn,
        transcription: 'テスト',
      });

      render(<VoiceRecorder onTranscriptionSave={mockOnTranscriptionSave} />);

      const volumeIcon = document.querySelector('.text-blue-500 svg');
      expect(volumeIcon).toBeInTheDocument();
    });
  });

  describe('エッジケース', () => {
    it('複数回の録音開始/停止が正しく動作する', async () => {
      const startListening = vi.fn();
      const stopListening = vi.fn();

      const { rerender } = render(<VoiceRecorder onTranscriptionSave={mockOnTranscriptionSave} />);

      // 最初は録音停止状態
      mockUseSpeechRecognition.mockReturnValue({
        ...defaultMockReturn,
        startListening,
        stopListening,
        isListening: false,
      });

      rerender(<VoiceRecorder onTranscriptionSave={mockOnTranscriptionSave} />);

      // 録音開始
      const startButton = screen.getByRole('button', { name: /録音開始/i });
      await userEvent.click(startButton);
      expect(startListening).toHaveBeenCalledTimes(1);

      // 録音中状態に更新
      mockUseSpeechRecognition.mockReturnValue({
        ...defaultMockReturn,
        startListening,
        stopListening,
        isListening: true,
      });

      rerender(<VoiceRecorder onTranscriptionSave={mockOnTranscriptionSave} />);

      // 録音停止
      const stopButton = screen.getByRole('button', { name: /停止/i });
      await userEvent.click(stopButton);
      expect(stopListening).toHaveBeenCalledTimes(1);

      // 再度録音停止状態に更新
      mockUseSpeechRecognition.mockReturnValue({
        ...defaultMockReturn,
        startListening,
        stopListening,
        isListening: false,
      });

      rerender(<VoiceRecorder onTranscriptionSave={mockOnTranscriptionSave} />);

      // 再度録音開始
      const startButton2 = screen.getByRole('button', { name: /録音開始/i });
      await userEvent.click(startButton2);
      expect(startListening).toHaveBeenCalledTimes(2);
    });

    it('長いテキストの文字起こしも正しく表示される', () => {
      const longText = 'あ'.repeat(500);
      mockUseSpeechRecognition.mockReturnValue({
        ...defaultMockReturn,
        transcription: longText,
      });

      render(<VoiceRecorder onTranscriptionSave={mockOnTranscriptionSave} />);

      expect(screen.getByText(longText)).toBeInTheDocument();
    });
  });
});
