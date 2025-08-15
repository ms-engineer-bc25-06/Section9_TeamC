'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useChildren } from '@/hooks/useChildren';
import { api } from '@/lib/api';
import { format, isSameMonth, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ArrowLeft, CalendarDays, Download } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// API連携用の型定義
interface ChallengeRecord {
  id: string;
  childId: string;
  date: string;
  summary: string;
}

export default function ChallengeHistoryPage() {
  const { children, isLoading: childrenLoading } = useChildren();
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [records, setRecords] = useState<ChallengeRecord[]>([]);
  const [thisMonthChallengeCount, setThisMonthChallengeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 子ども選択の初期化
  useEffect(() => {
    if (!childrenLoading && children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].id);
    }
    setLoading(false);
  }, [children, childrenLoading, selectedChildId]);

  // 選択された子どもの履歴を取得
  useEffect(() => {
    if (!selectedChildId) {
      setRecords([]);
      setThisMonthChallengeCount(0);
      return;
    }

    const fetchRecords = async () => {
      try {
        setLoading(true);

        // 音声認識履歴をAPIから取得
        const data = await api.voice.getHistory(selectedChildId);

        // APIレスポンスを画面表示用の形式に変換
        const recordsForChild = data.transcripts
          .map((item: { id: string; created_at: string; transcript?: string }) => ({
            id: item.id,
            childId: selectedChildId,
            date: item.created_at,
            summary: item.transcript
              ? item.transcript.length > 30
                ? item.transcript.substring(0, 30) + '...'
                : item.transcript
              : 'チャレンジ記録',
          }))
          .sort(
            (a: ChallengeRecord, b: ChallengeRecord) =>
              parseISO(b.date).getTime() - parseISO(a.date).getTime()
          );

        setRecords(recordsForChild);

        // 今月のチャレンジ回数を計算
        const currentMonth = new Date();
        const count = recordsForChild.filter((record: ChallengeRecord) =>
          isSameMonth(parseISO(record.date), currentMonth)
        ).length;
        setThisMonthChallengeCount(count);
      } catch (error) {
        console.error('履歴取得エラー:', error);
        setError('履歴の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [selectedChildId]);

  // ローディング中の表示
  if (loading && children.length === 0) {
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
        {/* 子ども選択プルダウン */}
        <div className="mb-8 w-full max-w-xs">
          <Select onValueChange={setSelectedChildId} value={selectedChildId}>
            <SelectTrigger className="w-full rounded-full bg-white/80 shadow-md text-lg font-semibold text-gray-700">
              <SelectValue placeholder="お子さまを選択" />
            </SelectTrigger>
            <SelectContent className="rounded-xl bg-white/90 shadow-lg">
              {children.map((child) => (
                <SelectItem key={child.id} value={child.id} className="text-lg">
                  {child.nickname}ちゃん
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 統計情報 */}
        <Card className="w-full rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-sm mb-8">
          <CardContent className="p-0 text-center">
            <p className="text-lg text-gray-600 mb-2">今月のチャレンジ回数</p>
            <p className="text-5xl font-extrabold text-blue-500">{thisMonthChallengeCount}回</p>
            <p className="text-sm text-gray-500 mt-2">
              {selectedChildId
                ? `${children.find((c) => c.id === selectedChildId)?.nickname}ちゃん、よくがんばったね！`
                : 'お子さまを選択してください'}
            </p>
          </CardContent>
        </Card>

        {/* 記録リスト */}
        <div className="w-full space-y-4 mb-8">
          {loading ? (
            <Card className="w-full rounded-xl bg-white/80 p-6 shadow-md backdrop-blur-sm text-center">
              <CardContent className="p-0">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-gray-600">履歴を読み込み中...</p>
              </CardContent>
            </Card>
          ) : records.length > 0 ? (
            records.map((record) => (
              <Card
                key={record.id}
                className="w-full rounded-xl bg-white/80 p-4 shadow-md backdrop-blur-sm flex items-center justify-between"
              >
                <CardContent className="p-0 flex items-center">
                  <CalendarDays className="h-8 w-8 text-purple-400 mr-4 flex-shrink-0" />
                  <div>
                    <p className="text-lg font-semibold text-gray-700">
                      {format(parseISO(record.date), 'yyyy年MM月dd日 (EEE)', { locale: ja })}
                    </p>
                    <p className="text-sm text-gray-500">{record.summary}</p>
                  </div>
                </CardContent>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full text-blue-500 border-blue-300 hover:bg-blue-50"
                >
                  <Link href={`/history/${record.childId}/${record.id}`}>詳細</Link>
                </Button>
              </Card>
            ))
          ) : (
            <Card className="w-full rounded-xl bg-white/80 p-6 shadow-md backdrop-blur-sm text-center">
              <CardContent className="p-0 text-gray-600 text-lg">
                まだチャレンジの記録がありません。
              </CardContent>
            </Card>
          )}
        </div>

        {/* エクスポート機能（今後実装予定） */}
        <Button
          disabled
          className="py-3 text-lg sm:py-4 sm:text-xl font-semibold rounded-full shadow-md w-full max-w-xs bg-gray-300 text-gray-500 cursor-not-allowed"
        >
          <Download className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
          記録をエクスポート（準備中）
        </Button>
      </main>
    </div>
  );
}
