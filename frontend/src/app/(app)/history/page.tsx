'use client';

import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, isSameMonth, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ArrowLeft, CalendarDays, Download } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// ------------------------------
// ダミーデータ（API導入後は削除予定）
// ------------------------------
const childrenData = [
  { id: '1', name: 'ひなた' },
  { id: '2', name: 'さくら' },
];

const dummyChallengeRecords = [
  {
    id: 'rec_001',
    childId: '1',
    date: '2025-08-02T10:00:00Z',
    summary: '初めての自己紹介チャレンジ！',
  },
  {
    id: 'rec_002',
    childId: '2',
    date: '2025-08-03T14:30:00Z',
    summary: '好きな動物を英語で言えたね！',
  },

  {
    id: 'rec_003',
    childId: '1',
    date: '2025-08-03T11:00:00Z',
    summary: '色を英語で完璧に言えたよ！',
  },
];

export default function ChallengeHistoryPage() {
  const [selectedChildId, setSelectedChildId] = useState<string>(childrenData[0]?.id || '');
  const [records, setRecords] = useState<typeof dummyChallengeRecords>([]);
  const [thisMonthChallengeCount, setThisMonthChallengeCount] = useState(0);

  useEffect(() => {
    if (!selectedChildId) {
      setRecords([]);
      setThisMonthChallengeCount(0);
      return;
    }

    // -------------------------------------------------
    // TODO: API導入時はこの部分をAPIリクエストに置き換える
    // 例: fetch(`/api/challenge-records?childId=${selectedChildId}`)
    // -------------------------------------------------
    const data = dummyChallengeRecords;

    const recordsForChild = data
      .filter((record) => record.childId === selectedChildId)
      .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

    setRecords(recordsForChild);

    // 今月のチャレンジ回数を計算
    const currentMonth = new Date();
    const count = recordsForChild.filter((record) =>
      isSameMonth(parseISO(record.date), currentMonth)
    ).length;
    setThisMonthChallengeCount(count);
  }, [selectedChildId]);

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 sm:p-6 lg:p-8">
      {/* ヘッダー */}
      <header className="relative w-full max-w-4xl flex justify-between items-center mb-8">
        <Link
          href="/children"
          className="text-gray-600 hover:text-gray-800 transition-colors flex items-center"
        >
          <ArrowLeft className="h-6 w-6 mr-1" />
          <span className="text-lg font-medium">戻る</span>
        </Link>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-xl font-bold text-gray-800 sm:text-2xl">
          チャレンジの記録
        </h1>
        <div className="w-24"></div>
      </header>

      <main className="w-full max-w-4xl flex-1 flex flex-col items-center py-8">
        {/* 子ども選択プルダウン */}
        <div className="mb-8 w-full max-w-xs">
          <Select onValueChange={setSelectedChildId} defaultValue={selectedChildId}>
            <SelectTrigger className="w-full rounded-full bg-white/80 shadow-md text-lg font-semibold text-gray-700">
              <SelectValue placeholder="お子さまを選択" />
            </SelectTrigger>
            <SelectContent className="rounded-xl bg-white/90 shadow-lg">
              {childrenData.map((child) => (
                <SelectItem key={child.id} value={child.id} className="text-lg">
                  {child.name}ちゃん
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
                ? `${childrenData.find((c) => c.id === selectedChildId)?.name}ちゃん、よくがんばったね！`
                : 'お子さまを選択してください'}
            </p>
          </CardContent>
        </Card>

        {/* 記録リスト */}
        <div className="w-full space-y-4 mb-8">
          {records.length > 0 ? (
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

        {/* エクスポート機能（今後API連携で動作予定） */}
        <Button className="py-3 text-lg sm:py-4 sm:text-xl font-semibold rounded-full shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400 bg-green-300 text-white hover:bg-green-400 w-full max-w-xs">
          <Download className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
          記録をエクスポート
        </Button>
      </main>
    </div>
  );
}
