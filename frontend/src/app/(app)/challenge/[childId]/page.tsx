'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useChildren } from '@/hooks/useChildren';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  ArrowRight,
  Droplets,
  Flower,
  HelpCircle,
  Mic,
  Save,
  Sprout,
  Volume2,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

// Web Speech APIの型定義を追加
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

export default function ChallengePage() {
  const params = useParams();
  const router = useRouter();
  const childId = params.childId as string;

  // ★ 重要：すべてのHooksをコンポーネントの最上部で呼び出す
  // Reactの「Hooksの規則」に従い、条件分岐の前に全てのHooksを配置

  // カスタムHooks
  const { children, isLoading } = useChildren();

  // state管理用のHooks
  const [isListening, setIsListening] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [shouldKeepListening, setShouldKeepListening] = useState(false); // 録音継続フラグ
  const [accumulatedTranscript, setAccumulatedTranscript] = useState(''); // 累積された文字起こし
  const [lastSpeechTime, setLastSpeechTime] = useState(Date.now()); // 最後の発話時刻

  const [showMamaPhraseDialog, setShowMamaPhraseDialog] = useState(false);
  const [showChildPhraseDialog, setShowChildPhraseDialog] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const cleanup = () => {
      setShouldKeepListening(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
    const handleBeforeUnload = () => {
      cleanup();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      cleanup();
    };
  }, []);

  // 子供の名前を取得（UUIDで検索）
  const child = children.find((c) => c.id === childId);
  const childName = child?.nickname || child?.name || 'お子さま';

  // ローディング中の表示
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
        <p className="mt-4 text-gray-600">読み込み中...</p>
      </div>
    );
  }

  // 子供が見つからない場合の表示
  if (!child) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
        <p className="text-gray-600 text-lg">お子さまが見つかりません</p>
        <Link href="/children" className="mt-4 text-blue-500 hover:text-blue-600">
          子供選択画面に戻る
        </Link>
      </div>
    );
  }

  // 録音開始処理 Web Speech API
  const startListening = async () => {
    try {
      const SpeechRecognitionConstructor = (window.SpeechRecognition ||
        window.webkitSpeechRecognition) as {
        new (): SpeechRecognition;
      };
      if (!SpeechRecognitionConstructor) {
        alert('お使いのブラウザは音声認識に対応していません。');
        return;
      }
      // フラグを設定：録音を継続する意思を示す
      setShouldKeepListening(true);
      setAccumulatedTranscript(''); // 累積テキストをリセット
      setTranscription('');
      setLastSpeechTime(Date.now());

      const startRecognition = () => {
        recognitionRef.current = new SpeechRecognitionConstructor();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'ja-JP';

        recognitionRef.current.onstart = () => {
          console.log('音声認識開始');
          setIsListening(true);
        };

        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          // 確定したテキストがある場合
          if (finalTranscript) {
            const currentTime = Date.now();
            const timeSinceLastSpeech = currentTime - lastSpeechTime;
            setAccumulatedTranscript((prev) => {
              // 前回の発話から3秒以上経過している場合は改行を追加
              const separator = timeSinceLastSpeech > 3000 && prev.length > 0 ? '\n\n' : '';
              return prev + separator + finalTranscript;
            });

            setLastSpeechTime(currentTime);
          }

          // 表示用のテキストを更新（累積 + 暫定）
          const currentTime = Date.now();
          const timeSinceLastSpeech = currentTime - lastSpeechTime;

          // 累積されたテキスト + 新しい確定テキスト + 暫定テキスト
          let displayText = accumulatedTranscript;

          if (finalTranscript) {
            // 3秒以上経過していて、既にテキストがある場合は改行を追加
            const separator =
              timeSinceLastSpeech > 3000 && accumulatedTranscript.length > 0 ? '\n\n' : '';
            displayText += separator + finalTranscript;
          }

          if (interimTranscript) {
            displayText += ' ' + interimTranscript;
          }

          setTranscription(displayText);
        };
        recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('音声認識エラー:', event.error);

          // どんなエラーが発生しても、shouldKeepListeningがtrueなら再開
          if (shouldKeepListening) {
            console.log('エラー後再開:', event.error);
            setTimeout(() => {
              if (shouldKeepListening) {
                startRecognition(); // 再帰的に再開
              }
            }, 500);
          }
        };

        recognitionRef.current.onend = () => {
          console.log('音声認識終了');

          // shouldKeepListeningがtrueの間は絶対に再開
          if (shouldKeepListening) {
            console.log('自動再開実行');
            setTimeout(() => {
              if (shouldKeepListening) {
                startRecognition(); // 再帰的に再開
              }
            }, 100);
          } else {
            // 手動停止された場合のみ完全停止
            setIsListening(false);
            console.log('録音完全停止');
          }
        };
        try {
          recognitionRef.current.start();
        } catch (error) {
          console.error('音声認識の開始に失敗:', error);

          // 開始に失敗しても再試行
          if (shouldKeepListening) {
            setTimeout(() => {
              if (shouldKeepListening) {
                startRecognition();
              }
            }, 1000);
          }
        }
      };
      // 初回開始
      startRecognition();
    } catch (error) {
      console.error('音声認識の初期化に失敗:', error);
      alert('音声認識を開始できませんでした。');
      setShouldKeepListening(false);
      setIsListening(false);
    }
  };

  // 録音停止処理
  const stopListening = () => {
    console.log('手動停止実行');
    // 最重要：継続フラグをfalseにして再開を完全に停止
    setShouldKeepListening(false);

    // 現在の認識を停止
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    // 最終的な文字起こし結果を設定
    if (accumulatedTranscript) {
      setTranscription(accumulatedTranscript);
    }
    setIsListening(false);
    console.log('録音完全停止完了');
  };

  // 録音保存処理
  const saveTranscription = async () => {
    if (!transcription.trim()) {
      alert('文字起こしされた内容がありません。');
      return;
    }

    setIsProcessing(true);

    try {
      // 直接文字起こしテキストを送信
      const result = await api.voice.saveTranscription({
        childId,
        transcription,
      });
      router.push(`/record/${result.transcript_id}`);
    } catch (error) {
      console.error('文字起こしの保存に失敗:', error);
      alert('保存に失敗しました。もう一度お試しください。');
    } finally {
      setIsProcessing(false);
    }
  };

  // メイン画面のレンダリング
  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
      {/* ヘッダー部分 */}
      <header className="w-full max-w-xl flex justify-between items-center mb-2">
        <Link
          href="/children"
          className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
        >
          <XCircle className="h-5 w-5 sm:h-6 sm:w-6 mr-1" />
          <span className="text-sm sm:text-base font-medium">やめる</span>
        </Link>
      </header>

      {/* メインコンテンツ */}
      <main className="flex flex-1 flex-col items-center justify-center w-full max-w-xl pt-2 pb-4">
        <div className="mb-8 flex flex-col items-center">
          {/* チャレンジ中テキスト */}
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 text-center">
            {isListening
              ? 'チャレンジ中・・・'
              : transcription
                ? 'お疲れさま！保存するをおしてね'
                : `${childName} がんばってね！`}
          </h2>

          {/* アニメーションアイコン */}
          <div className="flex items-center space-x-6">
            <div className="animate-bounce">
              <Droplets className="h-10 w-10 text-blue-400" />
            </div>
            <ArrowRight className="h-6 w-6 text-gray-400 animate-pulse" />
            <div className="animate-pulse">
              <Sprout className="h-12 w-12 text-green-500" />
            </div>
            <ArrowRight className="h-6 w-6 text-gray-400 animate-pulse delay-200" />
            <div className="animate-bounce delay-300">
              <Flower className="h-10 w-10 text-pink-500" />
            </div>
          </div>
        </div>

        {/* 録音ボタン */}
        <div className="flex flex-col items-center">
          {!transcription && (
            <Button
              onClick={isListening ? stopListening : startListening}
              className={cn(
                'w-40 h-40 sm:w-48 sm:h-48 rounded-full flex flex-col items-center justify-center shadow-xl transition-all duration-300',
                isListening
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                  : 'bg-blue-400 hover:bg-blue-500'
              )}
              size="icon"
            >
              {isListening ? (
                <>
                  <Mic className="h-16 w-16 sm:h-20 sm:w-20 text-white" />
                  <span className="mt-2 text-white text-base sm:text-lg font-semibold">
                    ストップ
                  </span>
                </>
              ) : (
                <>
                  <Mic className="h-16 w-16 sm:h-20 sm:w-20 text-white" />
                  <span className="mt-2 text-white text-base sm:text-lg font-semibold">
                    スタート
                  </span>
                </>
              )}
            </Button>
          )}
          {/* 文字起こし結果表示 */}
          {transcription && (
            <div className="w-full max-w-md mt-6 p-4 bg-white rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">文字起こし結果</h3>

              <div className="space-y-2">
                {transcription.split('\n').map((line, index) => {
                  if (!line.trim()) return null; // 空行はスキップ

                  // 1文字0.3秒、最低5秒（短すぎないようにする）
                  const duration = Math.max(5, line.length * 0.3);

                 return (
                  <div
                    key={index}
                    className="relative overflow-hidden h-10 bg-gray-50 p-2 rounded border"
                  >
                    <p
                       className="whitespace-nowrap"
                       style={{
                         animation: `marquee ${duration}s linear infinite`,
                    }}
                    >
                     {line}
                  </p>
                </div>
               );
             })}
           </div>

            {isListening && (
              <p className="text-sm text-blue-600 mt-2">
                📍 まだ録音中です。「ストップ」を押すと終了します。
             </p>
            )}
          </div>
        )}


          {/* 保存ボタン（録音完了後に表示） */}
          {transcription && !isListening && (
            <Button
              onClick={saveTranscription}
              disabled={isProcessing}
              className={cn(
                'py-3 mt-8 text-lg font-semibold rounded-full shadow-md w-40',
                isProcessing
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600 hover:scale-105'
              )}
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  まっててね...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" />
                  保存する
                </>
              )}
            </Button>
          )}
        </div>

        {/* フレーズヘルプボタン */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs mt-12">
          <Button
            onClick={() => setShowMamaPhraseDialog(true)}
            className="flex-1 py-4 text-lg font-bold rounded-full shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-400 bg-purple-300 text-white hover:bg-purple-400"
          >
            <Volume2 className="mr-3 h-6 w-6" />
            おねがい
          </Button>
          <Button
            onClick={() => setShowChildPhraseDialog(true)}
            className="flex-1 py-4 text-lg font-bold rounded-full shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 bg-yellow-300 text-white hover:bg-yellow-400"
          >
            <HelpCircle className="mr-3 h-6 w-6" />
            たすけて
          </Button>
        </div>
      </main>

      {/* お願いフレーズダイアログ */}
      <Dialog open={showMamaPhraseDialog} onOpenChange={setShowMamaPhraseDialog}>
        <DialogContent className="sm:max-w-[425px] rounded-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">おねがいフレーズ</DialogTitle>
            <DialogDescription className="text-gray-600 text-sm">
              外国の方に話しかける前に使えます。
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-3 text-lg text-gray-700">
            <p className="font-semibold">Hello! Excuse me, my child is learning English.</p>
            <p className="text-sm text-gray-500">（すみません。子供が英語を勉強しています。）</p>
            <p className="font-semibold">Would you mind speaking a little with my child?</p>
            <p className="text-sm text-gray-500">（少しお話しできますか？）</p>
          </div>
          <Button
            onClick={() => setShowMamaPhraseDialog(false)}
            className="mt-6 w-full rounded-full bg-blue-400 hover:bg-blue-500 text-white"
          >
            もどる
          </Button>
        </DialogContent>
      </Dialog>

      {/* 助けてフレーズダイアログ */}
      <Dialog open={showChildPhraseDialog} onOpenChange={setShowChildPhraseDialog}>
        <DialogContent className="sm:max-w-[425px] rounded-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">おたすけフレーズ</DialogTitle>
            <DialogDescription className="text-gray-600 text-sm">
              こまったときに、これをつかってみよう！
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-3 text-lg text-gray-700">
            <p className="font-semibold">Again, please.</p>
            <p className="text-sm text-gray-500">（もう一回いって）</p>
            <p className="font-semibold">Slowly, please.</p>
            <p className="text-sm text-gray-500">（ゆっくりいって）</p>
            <p className="font-semibold">Sorry, I do not understand.</p>
            <p className="text-sm text-gray-500">（ごめんね、わからなかった）</p>
            <p className="font-semibold">Thank you! Bye-bye.</p>
            <p className="text-sm text-gray-500">（ありがとう！バイバイ。）</p>
          </div>
          <Button
            onClick={() => setShowChildPhraseDialog(false)}
            className="mt-6 w-full rounded-full bg-blue-400 hover:bg-blue-500 text-white"
          >
            とじる
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}