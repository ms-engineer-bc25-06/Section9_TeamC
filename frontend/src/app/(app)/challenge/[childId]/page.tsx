'use client';

import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils'; // cn関数をインポート
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
        // ストリームを停止してマイクを解放
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setAudioBlob(null); // 新しい録音開始時に前のBlobをクリア
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

  // 録音保存（ダミー）
  const saveRecording = async () => {
    if (audioBlob) {
      console.log('録音データを保存中:', audioBlob);
      // TODO: ここで録音データをサーバーにアップロードし、文字起こしを行う
      // 例: const response = await fetch('/api/save-record', { method: 'POST', body: audioBlob });
      // const recordId = await response.json(); // サーバーからrecordIdを受け取る

      // ダミーのrecordIdを生成
      const recordId = `rec_${Date.now()}`;
      alert('録音を保存しました！');
      router.push(`/record/${recordId}`); // 記録画面に遷移
    } else {
      alert('保存する録音データがありません。');
    }
  };

  // コンポーネントアンマウント時に録音を停止
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 sm:p-6 lg:p-8">

      {/* ヘッダー */}
      <header className="relative w-full max-w-4xl flex justify-between items-center mb-8">
        <Link
          href="/children"
          className="text-gray-600 hover:text-gray-800 transition-colors flex items-center"
        >
          <XCircle className="h-6 w-6 mr-1" />
          <span className="text-lg font-medium">やめる</span>
        </Link>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-xl font-bold text-gray-800 sm:text-2xl">
          {childName}ちゃんのチャレンジ中！

        </h1>
        {/* 右側にスペースを確保するためだけの要素 */}
        <div className="w-24"></div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex flex-1 flex-col items-center justify-center w-full max-w-4xl py-8">
        {/* 録音ボタン */}
        <div className="flex flex-col items-center mb-12">
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            className={cn(
              'w-48 h-48 sm:w-64 sm:h-64 rounded-full flex flex-col items-center justify-center shadow-xl transition-all duration-300',
              isRecording
                ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                : 'bg-blue-400 hover:bg-blue-500'
            )}
            size="icon"
          >
            <Mic className="h-24 w-24 sm:h-32 sm:w-32 text-white" />
            <span className="mt-2 text-white text-lg sm:text-xl font-semibold">
              {isRecording ? '録音中...' : 'はじめる'}
            </span>
          </Button>
          {!isRecording && audioBlob && (
            <Button
              onClick={saveRecording}
              className="mt-8 py-3 text-lg sm:py-4 sm:text-xl font-semibold rounded-full shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400 bg-green-500 text-white hover:bg-green-600 w-48 sm:w-64"
            >
              <Save className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
              保存する
            </Button>
          )}
        </div>

        {/* フレーズボタン */}
        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-md">
          <Button
            onClick={() => setShowMamaPhraseDialog(true)}
            className="flex-1 py-3 text-lg sm:py-4 sm:text-xl font-semibold rounded-full shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-400 bg-purple-300 text-white hover:bg-purple-400"
          >
            <Volume2 className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
            おねがい
          </Button>
          <Button
            onClick={() => setShowChildPhraseDialog(true)}
            className="flex-1 py-3 text-lg sm:py-4 sm:text-xl font-semibold rounded-full shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 bg-yellow-300 text-white hover:bg-yellow-400"
          >
            <HelpCircle className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
            たすけて

          </Button>
        </div>
      </main>

      {/* ママ用フレーズダイアログ */}
      <Dialog open={showMamaPhraseDialog} onOpenChange={setShowMamaPhraseDialog}>
        <DialogContent className="sm:max-w-[425px] rounded-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800">お願いフレーズ</DialogTitle>
            <DialogDescription className="text-gray-600">
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
            閉じる
          </Button>
        </DialogContent>
      </Dialog>

      {/* 子ども用フレーズダイアログ */}
      <Dialog open={showChildPhraseDialog} onOpenChange={setShowChildPhraseDialog}>
        <DialogContent className="sm:max-w-[425px] rounded-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800">お助けフレーズ</DialogTitle>
            <DialogDescription className="text-gray-600">
              会話中に困った時に使ってください。
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-3 text-lg text-gray-700">
            <p className="font-semibold">Again, please.</p>
            <p className="text-sm text-gray-500">（もう一回話して）</p>
            <p className="font-semibold">Slowly, please.</p>
            <p className="text-sm text-gray-500">（ゆっくり話して）</p>
            <p className="font-semibold">Sorry, I don’t understand.</p>
            <p className="text-sm text-gray-500">（わからないよ）</p>
            <p className="font-semibold">Thank you! Bye-bye.</p>
            <p className="text-sm text-gray-500">（バイバイ!）</p>
          </div>
          <Button
            onClick={() => setShowChildPhraseDialog(false)}
            className="mt-6 w-full rounded-full bg-blue-400 hover:bg-blue-500 text-white"
          >
            閉じる
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
