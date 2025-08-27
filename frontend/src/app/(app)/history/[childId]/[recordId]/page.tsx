'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ArrowLeft, MessageSquareHeart, ThumbsUp } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

// API連携用の型定義（フレーズ提案を追加）
interface RecordDetail {
  id: string;
  childId: string;
  title: string;
  timestamp: Date;
  transcript: string;
  aiFeedback: {
    praise: string;
    advice: string;
  };
  phraseData: { en: string; ja: string } | null; // 新規: フレーズ提案データ
}

export default function ChallengeDetailPage() {
  const params = useParams();
  const childId = params.childId as string;
  const recordId = params.recordId as string;

  const [record, setRecord] = useState<RecordDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!recordId || !childId) {
      setError('記録IDまたは子どもIDが指定されていません');
      setLoading(false);
      return;
    }

    const fetchRecord = async () => {
      try {
        setLoading(true);
        setError(null);

        // 個別チャレンジの詳細データをAPIから取得
        const data = await api.voice.getChallenge(recordId);

        // child_idが一致するかチェック
        if (data.child_id !== childId) {
          throw new Error('指定されたチャレンジ記録が見つかりませんでした');
        }

        // commentをJSON.parseしてfeedback_shortとphrase_suggestionを取得
        const comment = data.comment || 'AIフィードバックを生成中です...';
        let praise = '';
        let advice = '';
        let phraseData: { en: string; ja: string } | null = null;

        try {
          const parsed = JSON.parse(comment);
          // JSON形式の場合：feedback_shortとphrase_suggestionを取得
          praise = parsed?.feedback_short || '';
          phraseData = parsed?.phrase_suggestion || null;
        } catch {
          // JSON parseに失敗した場合は旧データ対応（splitAIFeedback使用）
          const splitComment = splitAIFeedback(comment);
          praise = splitComment.praise;
          advice = splitComment.advice;
        }

        // APIレスポンスを画面表示用の形式に変換
        setRecord({
          id: data.id,
          childId: data.child_id,
          title: 'チャレンジ記録',
          timestamp: new Date(data.created_at),
          transcript: data.transcript || '音声認識処理中...',
          aiFeedback: {
            praise: praise,
            advice: advice, // JSON形式では基本的に空（旧データのみ使用）
          },
          phraseData: phraseData, // JSON形式ならフレーズ1件、旧形式ならnull
        });
      } catch (error) {
        console.error('記録取得エラー:', error);
        setError(error instanceof Error ? error.message : '記録の取得に失敗しました');
        setRecord(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRecord();
  }, [recordId, childId]);

  // AIフィードバックを praise と advice に分割する関数（旧データ用）
  const splitAIFeedback = (comment: string) => {
    const sentences = comment.split(/[。！\n]/).filter((s) => s.trim());

    if (sentences.length >= 2) {
      const midPoint = Math.ceil(sentences.length / 2);
      return {
        praise: sentences.slice(0, midPoint).join('。') + '。',
        advice: sentences.slice(midPoint).join('。') + '。',
      };
    } else {
      return {
        praise: comment,
        advice: '',
      };
    }
  };

  // ローディング中の表示
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 sm:p-6 lg:p-8 text-center">
        <Card className="w-full max-w-md rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-sm">
          <CardContent className="p-0">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">記録を読み込み中...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // エラーまたは記録なしの場合
  if (error || !record) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 sm:p-6 lg:p-8 text-center">
        <Card className="w-full max-w-md rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-sm">
          <CardContent className="p-0">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">記録が見つかりません</h1>
            <p className="text-gray-600 mb-6">
              {error || '指定されたチャレンジ記録のデータが見つかりませんでした。'}
            </p>
            <Link href="/children" passHref>
              <Button className="w-full py-3 text-lg font-semibold rounded-full bg-blue-400 text-white hover:bg-blue-500">
                ホームに戻る
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // メイン画面の表示
  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 sm:p-6 lg:p-8">
      {/* ヘッダー */}
      <header className="w-full max-w-4xl grid grid-cols-3 items-center mb-8">
        <Link
          href="/history"
          className="text-gray-600 hover:text-gray-800 transition-colors flex items-center"
        >
          <ArrowLeft className="h-6 w-6 mr-1" />
          <span className="text-lg font-medium">もどる</span>
        </Link>
        <h1 className="text-xl font-bold text-gray-800 sm:text-2xl text-center col-span-1">
          <span className="whitespace-nowrap">
            {format(record.timestamp, 'yyyy年MM月dd日 (EEE)', { locale: ja })}
          </span>
        </h1>
        <div className="col-span-1"></div>
      </header>

      <main className="w-full max-w-2xl flex-1 flex flex-col items-center py-8">
        {/* 文字起こしテキスト表示 */}
        <Card className="w-full rounded-xl bg-blue-100/80 p-6 shadow-lg backdrop-blur-sm mb-8">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-xl font-bold text-gray-800">話したこと</CardTitle>
          </CardHeader>
          <CardContent className="p-0 text-left">
            <div className="relative bg-white p-4 rounded-xl shadow-sm text-gray-800 text-lg leading-relaxed">
              {record.transcript}
            </div>
          </CardContent>
        </Card>

        {/* AIフィードバック表示 */}
        <Card className="w-full rounded-xl bg-green-100/80 p-6 shadow-lg backdrop-blur-sm mb-8">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-xl font-bold text-gray-800">AIから</CardTitle>
          </CardHeader>
          <CardContent className="p-0 text-left space-y-4">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-green-700 mb-1">
                <ThumbsUp className="h-5 w-5 text-blue-500" />
                いいね
              </h3>
              <p className="text-gray-700 text-base leading-relaxed">{record.aiFeedback.praise}</p>
            </div>
            {/* アドバイスがある場合のみ表示（主に旧データ用） */}
            {record.aiFeedback.advice && (
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-orange-700 mb-1">
                  <MessageSquareHeart className="h-5 w-5 text-pink-500" />
                  アドバイス
                </h3>
                <p className="text-gray-700 text-base leading-relaxed">
                  {record.aiFeedback.advice}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* フレーズ提案カード（JSON形式でphrase_suggestionがある場合のみ表示） */}
        {record.phraseData && (
          <Card className="w-full rounded-xl bg-blue-50/80 p-6 shadow-lg backdrop-blur-sm mb-8">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg font-bold text-blue-800">
                💡 こんな言い方もあるよ！
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="bg-white/60 rounded-lg p-4">
                {/* 英語フレーズ */}
                <p className="text-xl font-semibold text-blue-700 mb-2">{record.phraseData.en}</p>
                {/* 日本語の意味 */}
                <p className="text-gray-600">{record.phraseData.ja}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Link href="/children" passHref>
          <Button className="w-full max-w-xs py-3 text-lg sm:py-4 sm:text-xl font-semibold rounded-full shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 bg-blue-500 text-white hover:bg-blue-600">
            ホームに戻る
          </Button>
        </Link>
      </main>
    </div>
  );
}
