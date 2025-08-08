'use client';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale'; // 日本語ロケールをインポート
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

// TODO: 将来的にはAPIから取得するダミーデータは別ファイルに分割しても良い
const dummyRecords = [
  {
    id: 'rec_1700000000000', // 例: rec_Date.now()
    childId: '1',
    childName: 'ひなた',
    timestamp: new Date('2025-08-07T10:30:00Z'),
    aiFeedback:
      'ひなたちゃん、素晴らしい発音でした！特に"apple"の発音がとてもクリアで、自信を持って話せていましたね。これからも色々な単語に挑戦してみよう！',
  },
  {
    id: 'rec_1700000000001',
    childId: '2',
    childName: 'さくら',
    timestamp: new Date('2025-08-07T11:15:00Z'),
    aiFeedback:
      'さくらちゃん、今日は積極的に話そうとする姿勢がとても良かったです！少し詰まっても、最後まで伝えようとする気持ちが大切だよ。次はもっと長い文章に挑戦してみようね！',
  },
];

export default function RecordCompletionPage() {
  const params = useParams();
  const recordId = params.recordId as string;

  const [record, setRecord] = useState<(typeof dummyRecords)[0] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: API連携時はfetchやaxiosで非同期取得する想定
    setLoading(true);

    // ダミーデータから該当recordを探す（同期処理）
    const foundRecord = dummyRecords.find((rec) => rec.id === recordId) ?? null;

    // 本来は非同期通信の完了を待つのでsetTimeoutで擬似遅延を入れても良い
    setRecord(foundRecord);
    setLoading(false);
  }, [recordId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 sm:p-6 lg:p-8 text-center">
        <p className="text-gray-600 text-lg">読み込み中...</p>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 sm:p-6 lg:p-8 text-center">
        <Card className="w-full max-w-md rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-sm">
          <CardContent className="p-0">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">記録が見つかりません</h1>
            <p className="text-gray-600 mb-6">指定された記録IDのデータが見つかりませんでした。</p>
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 sm:p-6 lg:p-8 text-center">
      <main className="w-full max-w-2xl flex-1 flex flex-col items-center justify-center py-8">
        <h1 className="mb-8 text-4xl font-extrabold text-pink-600 sm:text-5xl md:text-6xl drop-shadow-lg">
          よくがんばったね！
        </h1>

        <Card className="w-full rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-sm mb-8">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-xl font-bold text-gray-800 sm:text-2xl">
              {record.childName}ちゃんへのメッセージ
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 text-left">
            <p className="text-gray-700 text-base sm:text-lg leading-relaxed">
              {record.aiFeedback}
            </p>
            <div className="mt-6 text-sm text-gray-500">
              <p>記録日時: {format(record.timestamp, 'yyyy年MM月dd日 HH:mm', { locale: ja })}</p>
            </div>
          </CardContent>
        </Card>

        <Link href="/children" passHref>
          <Button className="w-full max-w-xs py-3 text-lg sm:py-4 sm:text-xl font-semibold rounded-full shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 bg-blue-400 text-white hover:bg-blue-500">
            ホームに戻る
          </Button>
        </Link>
      </main>
    </div>
  );
}

