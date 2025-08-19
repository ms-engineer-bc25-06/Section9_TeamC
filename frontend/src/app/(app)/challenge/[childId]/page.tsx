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
  // 新しく追加するアイコン
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

export default function ChallengePage() {
  const params = useParams();
  const router = useRouter();
  const childId = params.childId as string;

  // ★ 重要：すべてのHooksをコンポーネントの最上部で呼び出す
  // Reactの「Hooksの規則」に従い、条件分岐の前に全てのHooksを配置

  // カスタムHooks
  const { children, isLoading } = useChildren();

  // state管理用のHooks
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showMamaPhraseDialog, setShowMamaPhraseDialog] = useState(false);
  const [showChildPhraseDialog, setShowChildPhraseDialog] = useState(false);

  // ref用のHooks
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // effect用のHooks（クリーンアップ処理）
  useEffect(() => {
    return () => {
      // コンポーネントがアンマウントされる時、録音中なら停止
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  // ★ 全てのHooksを呼び出した後で、条件分岐による表示制御を行う
  // これにより、毎回同じ順序・同じ数のHooksが呼ばれることを保証

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

  // 録音開始処理
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

  // 録音停止処理
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // 録音保存処理
  const saveRecording = async () => {
    if (!audioBlob) {
      alert('保存する録音データがありません。');
      return;
    }

    setIsUploading(true);

    try {
      // サーバーに音声データを送信して文字起こし
      const result = await api.voice.transcribe(audioBlob, childId);
      // 結果画面に遷移
      router.push(`/record/${result.transcript_id}`);
    } catch (error) {
      console.error('録音の保存に失敗しました:', error);
      alert('録音の保存に失敗しました。もう一度お試しください。');
    } finally {
      setIsUploading(false);
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
            {isRecording
              ? 'チャレンジ中・・・'
              : audioBlob
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

          {/* 保存ボタン（録音完了後に表示） */}
          {audioBlob && (
            <Button
              onClick={saveRecording}
              disabled={isUploading}
              className={cn(
                'py-3 mt-8 text-lg font-semibold rounded-full shadow-md w-40',
                isUploading
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600 hover:scale-105'
              )}
            >
              {isUploading ? (
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
