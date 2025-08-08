
'use client';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// ダミーのチャレンジ記録詳細データ
const dummyRecordDetails = [
  {
    id: 'rec_001',
    childId: '1',
    title: '自己紹介チャレンジ',
    timestamp: new Date('2025-08-02T10:00:00Z'),
    transcript: 'Hello, my name is Hinata. I am six years old. Nice to meet you!',
    aiFeedback: {
      praise:
        'ひなたちゃん、とてもはっきりと自己紹介ができましたね！特に"Hello"と"Nice to meet you"の発音が素晴らしいです。自信を持って話せていましたね！',
      advice:
        'もう少しゆっくり話すと、もっと相手に伝わりやすくなりますよ。次は、好きなものを英語で紹介してみよう！',
    },
  },
  {
    id: 'rec_002',
    childId: '2',
    title: '好きな動物チャレンジ',
    timestamp: new Date('2025-08-03T14:30:00Z'),
    transcript: 'I like cats. Cats are cute. Meow!',
    aiFeedback: {
      praise:
        'さくらちゃん、"cats"の発音がとても上手でした！擬音語の"Meow!"も可愛らしくて、表現力が豊かですね。',
      advice:
        '文章のつなぎ目を意識すると、より自然な会話になります。例えば、"I like cats. They are cute."のように言ってみましょう。',
    },
  },
  {
    id: 'rec_003',
    childId: '1',
    title: '今日のチャレンジ',
    timestamp: new Date('2025-08-03T10:30:00Z'),
    transcript: 'Hello, how are you? I am fine, thank you. And you?',
    aiFeedback: {
      praise:
        'ひなたちゃん、基本的な挨拶がとてもスムーズにできましたね！相手を気遣う質問もできていて素晴らしいです。',
      advice: '次は、自分の気持ちをもう少し詳しく表現する言葉を覚えてみましょう。',
    },
  },
];

export default function ChallengeDetailPage() {
  const params = useParams();
  const childId = params.childId as string;
  const recordId = params.recordId as string;

  const record = dummyRecordDetails.find((rec) => rec.id === recordId && rec.childId === childId);

  if (!record) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 sm:p-6 lg:p-8 text-center">
        <Card className="w-full max-w-md rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-sm">
          <CardContent className="p-0">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">記録が見つかりません</h1>
            <p className="text-gray-600 mb-6">
              指定されたチャレンジ記録のデータが見つかりませんでした。
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

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 sm:p-6 lg:p-8">
      {/* ヘッダー */}
      <header className="relative w-full max-w-4xl flex justify-between items-center mb-8">
        <Link
          href="/history"
          className="text-gray-600 hover:text-gray-800 transition-colors flex items-center"
        >
          <ArrowLeft className="h-6 w-6 mr-1" />
          <span className="text-lg font-medium">もどる</span>
        </Link>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-xl font-bold text-gray-800 sm:text-2xl text-center">
          {format(record.timestamp, 'yyyy年MM月dd日 (EEE)', { locale: ja })}
          <br />
        </h1>
        {/* 右側にスペースを確保するためだけの要素 */}
        <div className="w-24"></div>
      </header>

      <main className="w-full max-w-2xl flex-1 flex flex-col items-center py-8">
        {/* 文字起こしテキスト */}
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

        {/* AIフィードバック */}
        <Card className="w-full rounded-xl bg-green-100/80 p-6 shadow-lg backdrop-blur-sm mb-8">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-xl font-bold text-gray-800">AIから</CardTitle>
          </CardHeader>
          <CardContent className="p-0 text-left space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-green-700 mb-1">✨ いいね</h3>
              <p className="text-gray-700 text-base leading-relaxed">{record.aiFeedback.praise}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-orange-700 mb-1">💡 アドバイス</h3>
              <p className="text-gray-700 text-base leading-relaxed">{record.aiFeedback.advice}</p>
            </div>
          </CardContent>
        </Card>

        <Link href="/children" passHref>
          <Button className="w-full max-w-xs py-3 text-lg sm:py-4 sm:text-xl font-semibold rounded-full shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 bg-blue-400 text-white hover:bg-blue-500">
            ホーム
          </Button>
        </Link>
      </main>
    </div>
  );
}

