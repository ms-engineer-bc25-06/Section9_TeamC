'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { HelpCircle, Mic, Save, Volume2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

// ダミーの子どもデータ（実際にはDBから取得）
const childrenData = [
  { id: '1', name: 'ひなた' },
  { id: '2', name: 'さくら' },
];

export default function ChallengePage() {
  const params = useParams();
  const router = useRouter();
  const childId = params.childId as string;
  const childName = childrenData.find((c) => c.id === childId)?.name || 'お子さま';

  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [showMamaPhraseDialog, setShowMamaPhraseDialog] = useState(false);
  const [showChildPhraseDialog, setShowChildPhraseDialog] = useState(false);

  // 録音開始
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setAudioBlob(null);
    } catch (error) {
      console.error('マイクへのアクセスに失敗しました:', error);
      alert('マイクへのアクセスを許可してください。');
    }
  };

  // 録音停止
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // 録音保存
  const saveRecording = async () => {
    if (!audioBlob) {
      alert('保存する録音データがありません。');
      return;
    }

    setIsUploading(true);

    try {
      // サーバーに送信
      const result = await api.voice.transcribe(audioBlob, childId);

      // 処理完了後の遷移処理
      router.push(`/record/${result.transcript_id}`);
    } catch (error) {
      console.error('録音の保存に失敗しました:', error);
      alert('録音の保存に失敗しました。もう一度お試しください。');
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
      {/* ヘッダー */}
      <header className="w-full max-w-xl flex justify-between items-center mb-4">
        <Link
          href="/children"
          className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
        >
          <XCircle className="h-5 w-5 sm:h-6 sm:w-6 mr-1" />
          <span className="text-sm sm:text-base font-medium">やめる</span>
        </Link>
        <h1 className="flex-1 text-center text-lg font-bold text-gray-800 sm:text-xl">
          <span className="font-extrabold text-2xl sm:text-3xl">{childName}</span>ちゃん
          <br className="sm:hidden" />
          チャレンジ中！
        </h1>
        <div className="w-20 sm:w-24"></div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex flex-1 flex-col items-center justify-center w-full max-w-xl py-4">
        {/* 録音ボタン */}
        <div className="flex flex-col items-center">
          {!audioBlob && (
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              className={cn(
                'w-40 h-40 sm:w-48 sm:h-48 rounded-full flex flex-col items-center justify-center shadow-xl transition-all duration-300',
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                  : 'bg-blue-400 hover:bg-blue-500'
              )}
              size="icon"
            >
              {isRecording ? (
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

          {/* 保存する */}
          {audioBlob && (
            <Button
              onClick={saveRecording}
              disabled={isUploading}
              className={cn(
                'py-3 mt-8 text-lg font-semibold rounded-full shadow-md w-40',
                isUploading
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed' // 送信中：グレーで無効化
                  : 'bg-green-500 text-white hover:bg-green-600 hover:scale-105'
              )}
            >
              {isUploading ? ( // ←条件分岐：送信中は異なる表示
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

        {/* フレーズボタン */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs mt-12">
          <Button
            onClick={() => setShowMamaPhraseDialog(true)}
            className="flex-1 py-3 text-sm sm:text-base font-semibold rounded-full shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-400 bg-purple-300 text-white hover:bg-purple-400"
          >
            <Volume2 className="mr-2 h-4 w-4" />
            おねがい
          </Button>
          <Button
            onClick={() => setShowChildPhraseDialog(true)}
            className="flex-1 py-3 text-sm sm:text-base font-semibold rounded-full shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 bg-yellow-300 text-white hover:bg-yellow-400"
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            たすけて
          </Button>
        </div>
      </main>

      {/* ママ用フレーズダイアログ */}
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

      {/* 子ども用フレーズダイアログ */}
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
            <p className="font-semibold">Sorry, I don’t understand.</p>
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
