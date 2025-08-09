'use client'; // クライアントコンポーネントとしてマーク

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react'; // チェックマークアイコン
import Link from 'next/link';
import { useSearchParams } from 'next/navigation'; // useSearchParamsをインポート

export default function ChallengeConfirmPage() {
  const searchParams = useSearchParams();
  const childId = searchParams.get('childId'); // URLからchildIdを取得

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-lg rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-sm sm:p-8 md:p-10 text-center">
        <CardContent className="p-0">
          <h1 className="mb-4 text-2xl font-bold text-gray-800 sm:text-3xl">
            いっしょにチェックしよう！
          </h1>
          <p className="mb-8 text-center text-gray-600 text-sm sm:text-base">
            すべてチェックできたら、お話しできるよ。
          </p>

          <div className="mb-10 space-y-4 text-left">
            <div className="flex items-start">
              <CheckCircle className="mr-3 mt-1 h-6 w-6 flex-shrink-0 text-green-500" />
              <div>
                <p className="text-base font-semibold text-gray-700 sm:text-lg">
                  外国人の方に話しかけても大丈夫な状況ですか？
                </p>
                <p className="text-sm text-gray-500">
                  周りの環境や時間帯を確認して、安心して話せる場所を選びましょう。
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircle className="mr-3 mt-1 h-6 w-6 flex-shrink-0 text-green-500" />
              <div>
                <p className="text-base font-semibold text-gray-700 sm:text-lg">
                  お子さまは話したい気持ちになっていますか？
                </p>
                <p className="text-sm text-gray-500">
                  無理強いせず、お子さまの「話したい！」という気持ちを大切にしましょう。
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircle className="mr-3 mt-1 h-6 w-6 flex-shrink-0 text-green-500" />
              <div>
                <p className="text-base font-semibold text-gray-700 sm:text-lg">
                  録音の準備はできていますか？
                </p>
                <p className="text-sm text-gray-500">
                  チャレンジの記録を残すために、スマートフォンの録音機能などを準備しておきましょう。
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            {/* childIdが存在する場合のみリンクを有効にする */}
            <Link href={childId ? `/challenge/${childId}` : '#'} passHref>
              <Button
                className="w-full py-3 text-lg sm:py-4 sm:text-xl font-semibold rounded-full shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400 bg-green-500 text-white hover:bg-green-600"
                size="lg"
                disabled={!childId} // childIdがない場合はボタンを無効化
              >
                準備OK！始める
              </Button>
            </Link>
            <Link href="/children" passHref>
              <Button
                className="w-full py-3 text-lg sm:py-4 sm:text-xl font-semibold rounded-full shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400 bg-orange-400 text-white hover:bg-orange-500"
                size="lg"
                variant="outline"
              >
                もう少し待つ
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
