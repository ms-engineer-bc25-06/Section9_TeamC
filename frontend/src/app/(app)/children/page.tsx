'use client';

import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { BarChart, Plus, Star } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const childrenData = [
  { id: '1', name: 'ひなた', age: 6 },
  { id: '2', name: 'さくら', age: 8 },
];

export default function ChildrenPage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      router.push('/');
    }
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

      <main className="flex w-full max-w-4xl flex-1 flex-col items-center justify-center py-4">
        <h1 className="mb-8 text-center text-3xl font-bold text-gray-800 sm:text-4xl md:text-5xl">
          えらんでね
        </h1>

        <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {childrenData.map((child) => (
            <Link href={`/children/confirm?childId=${child.id}`} key={child.id} className="block">
              <Card className="flex h-full cursor-pointer flex-col items-center justify-center rounded-xl bg-white/80 p-6 text-center shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg">
                <CardContent className="flex flex-col items-center p-0">
                  <p className="text-xl font-semibold text-gray-700 sm:text-2xl">
                    {child.name}ちゃん
                  </p>
                  <p className="text-md text-gray-500 sm:text-lg">（{child.age}歳）</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>

      <footer className="sticky bottom-0 z-10 mt-8 w-full max-w-4xl rounded-t-xl bg-white/90 p-4 shadow-lg backdrop-blur-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-around">
          <Button
            asChild
            className="flex-1 py-3 text-lg sm:py-4 sm:text-xl font-semibold rounded-full shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400 bg-green-300 text-white hover:bg-green-400 w-full"
          >
            <Link href="/children/register">
              <Plus className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
              なまえを登録
            </Link>
          </Button>
          <Button
            asChild
            className="flex-1 py-3 text-lg sm:py-4 sm:text-xl font-semibold rounded-full shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 bg-blue-300 text-white hover:bg-blue-400 w-full"
          >
            <Link href="/history">
              <BarChart className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
              ふりかえり
            </Link>
          </Button>
          <Button
            asChild
            className="flex-1 py-3 text-lg sm:py-4 sm:text-xl font-semibold rounded-full shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 bg-yellow-300 text-white hover:bg-yellow-400 w-full"
          >
            <Link href="/upgrade">
              <Star className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
              プレミアムプラン
            </Link>
          </Button>
        </div>
      </footer>
    </div>
  );
}
