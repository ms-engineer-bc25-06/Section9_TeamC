'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { BarChart, Plus, Star } from 'lucide-react';
import Image from 'next/image';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const childrenData = [
  { id: '1', name: 'ひなた', age: 6, avatar: '/placeholder.svg?height=100&width=100' },
  { id: '2', name: 'さくら', age: 8, avatar: '/placeholder.svg?height=100&width=100' },
];

export default function ChildrenPage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [user, loading, router]);

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>🔄 読み込み中...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-4xl flex justify-between items-center mb-4">
        <div>
          <p className="text-gray-600 text-lg">こんにちは、{user.displayName}さん</p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
        >
          ログアウト
        </button>
      </header>

      <main className="flex w-full max-w-4xl flex-1 flex-col items-center justify-center py-8">
        <h2 className="mb-8 text-center text-3xl font-bold text-gray-800 sm:text-4xl md:text-5xl">
          今日は誰がチャレンジする？
        </h2>

        {childrenData.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">子ども一覧</h2>
            <p className="text-gray-500">まだ子どもが登録されていません</p>
            <Link href="/children/register">
              <button className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                子どもを追加
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {childrenData.map((child) => (
              <Link href={`/children/confirm?childId=${child.id}`} key={child.id} className="block">
                <Card className="flex h-full cursor-pointer flex-col items-center justify-center rounded-xl bg-white/80 p-4 text-center shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg">
                  <CardContent className="flex flex-col items-center p-0">
                    <div className="mb-4 h-24 w-24 overflow-hidden rounded-full border-4 border-pink-200 bg-gray-100">
                      <Image
                        src={child.avatar || '/placeholder.svg'}
                        alt={`${child.name}ちゃんの写真`}
                        width={96}
                        height={96}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <p className="text-xl font-semibold text-gray-700 sm:text-2xl">
                      {child.name}ちゃん
                    </p>
                    <p className="text-md text-gray-500 sm:text-lg">（{child.age}歳）</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="sticky bottom-0 z-10 mt-8 w-full max-w-4xl rounded-t-xl bg-white/90 p-4 shadow-lg backdrop-blur-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-around">
          <Link href="/children/register">
            <Button className="w-full bg-green-300 text-white hover:bg-green-400">
              <Plus className="mr-2 h-5 w-5" />
              お子さまを追加
            </Button>
          </Link>
          <Link href="/history">
            <Button className="w-full bg-blue-300 text-white hover:bg-blue-400">
              <BarChart className="mr-2 h-5 w-5" />
              チャレンジ履歴
            </Button>
          </Link>
          <Link href="/upgrade">
            <Button className="w-full bg-yellow-300 text-white hover:bg-yellow-400">
              <Star className="mr-2 h-5 w-5" />
              プレミアムプラン
            </Button>
          </Link>
        </div>
      </footer>
    </div>
  );
}
