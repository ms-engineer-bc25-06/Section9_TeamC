'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChildSelector } from '@/components/history/ChildSelector';
import { ExportButton } from '@/components/history/ExportButton';
import { MonthlyStats } from '@/components/history/MonthlyStats';
import { RecordsList } from '@/components/history/RecordsList';
import { useChildren } from '@/hooks/useChildren';
import { useHistoryRecords } from '@/hooks/useHistoryRecords';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function ChallengeHistoryPage() {
  const { children, isLoading: childrenLoading } = useChildren();
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  
  const {
    records,
    thisMonthChallengeCount,
    loading,
    error,
    deletingId,
    handleDelete,
  } = useHistoryRecords(selectedChildId);


  useEffect(() => {
    if (!childrenLoading && children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].id);
    }
  }, [children, childrenLoading, selectedChildId]);

  if (childrenLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 sm:p-6 lg:p-8 text-center">
        <Card className="w-full max-w-md rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-sm">
          <CardContent className="p-0">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">データを読み込み中...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // エラー表示
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 sm:p-6 lg:p-8 text-center">
        <Card className="w-full max-w-md rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-sm">
          <CardContent className="p-0">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">エラーが発生しました</h1>
            <p className="text-gray-600 mb-6">{error}</p>
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

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 sm:p-6 lg:p-8">
      {/* ヘッダー */}
      <header className="relative w-full max-w-4xl flex justify-between items-center mb-8">
        <Link
          href="/children"
          className="text-gray-600 hover:text-gray-800 transition-colors flex items-center"
        >
          <ArrowLeft className="h-6 w-6 mr-1" />
          <span className="text-lg font-medium">もどる</span>
        </Link>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-xl font-bold text-gray-800 sm:text-2xl">
          チャレンジの記録
        </h1>
        <div className="w-24"></div>
      </header>

      <main className="w-full max-w-4xl flex-1 flex flex-col items-center py-8">
        <ChildSelector
          children={children}
          selectedChildId={selectedChildId}
          onChildSelect={setSelectedChildId}
        />

        <MonthlyStats
          challengeCount={thisMonthChallengeCount}
          selectedChildId={selectedChildId}
          children={children}
        />

        <RecordsList
          records={records}
          loading={loading}
          deletingId={deletingId}
          onDelete={handleDelete}
        />

        <ExportButton />
      </main>
    </div>
  );
}
