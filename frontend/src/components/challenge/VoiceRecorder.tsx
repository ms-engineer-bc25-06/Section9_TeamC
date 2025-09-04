// 音声録音コンポーネント - テスト可能な分離

import { Button } from '@/components/ui/button';
import { Mic, Volume2, Save } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

interface VoiceRecorderProps {
  onTranscriptionSave: (transcription: string) => Promise<void>;
  disabled?: boolean;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscriptionSave,
  disabled = false,
}) => {
  const {
    isListening,
    transcription,
    isProcessing,
    isSupported,
    startListening,
    stopListening,
    resetTranscription,
  } = useSpeechRecognition();

  const handleSave = async () => {
    if (transcription.trim()) {
      await onTranscriptionSave(transcription);
      resetTranscription();
    }
  };

  if (!isSupported) {
    return (
      <div className="text-center p-4 bg-gray-100 rounded-lg">
        このブラウザは音声認識をサポートしていません
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 録音コントロール */}
      <div className="flex justify-center space-x-4">
        <Button
          onClick={isListening ? stopListening : startListening}
          disabled={disabled || isProcessing}
          variant={isListening ? 'destructive' : 'default'}
          size="lg"
          className="min-w-[120px]"
        >
          <Mic className="w-5 h-5 mr-2" />
          {isProcessing ? '準備中...' : isListening ? '停止' : '録音開始'}
        </Button>

        {transcription && (
          <Button
            onClick={handleSave}
            disabled={disabled || !transcription.trim()}
            variant="outline"
            size="lg"
          >
            <Save className="w-5 h-5 mr-2" />
            保存
          </Button>
        )}
      </div>

      {/* 文字起こし結果 */}
      {transcription && (
        <div className="bg-gray-50 p-4 rounded-lg min-h-[100px]">
          <div className="flex items-center mb-2">
            <Volume2 className="w-5 h-5 mr-2 text-blue-500" />
            <span className="font-medium">認識された音声:</span>
          </div>
          <p className="text-gray-700 whitespace-pre-wrap">{transcription}</p>
        </div>
      )}

      {/* 録音状態表示 */}
      {isListening && (
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 text-red-500">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span>録音中...</span>
          </div>
        </div>
      )}
    </div>
  );
};
