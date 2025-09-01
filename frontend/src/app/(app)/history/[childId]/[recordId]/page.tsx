'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AIFeedbackCard } from '@/components/record/AIFeedbackCard';
import { PhraseCard } from '@/components/record/PhraseCard';
import { RecordHeader } from '@/components/record/RecordHeader';
import { TranscriptCard } from '@/components/record/TranscriptCard';
import { useRecordDetail } from '@/hooks/useRecordDetail';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function ChallengeDetailPage() {
  const params = useParams();
  const childId = params.childId as string;
  const recordId = params.recordId as string;

  const { record, loading, error } = useRecordDetail(recordId, childId);


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
      <RecordHeader timestamp={record.timestamp} />

      <main className="w-full max-w-2xl flex-1 flex flex-col items-center py-8">
        <TranscriptCard transcript={record.transcript} />
        <AIFeedbackCard aiFeedback={record.aiFeedback} />
        {record.phraseData && <PhraseCard phraseData={record.phraseData} />}

        <Link href="/children" passHref>
          <Button className="w-full max-w-xs py-3 text-lg sm:py-4 sm:text-xl font-semibold rounded-full shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 bg-blue-500 text-white hover:bg-blue-600">
            ホームに戻る
          </Button>
        </Link>
      </main>
    </div>
  );
}
