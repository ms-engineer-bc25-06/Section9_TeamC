'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useChildren } from '@/hooks/useChildren';
import { BarChart, Plus, Star } from 'lucide-react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ChildrenPage() {
  const { user, logout, loading } = useAuth();
  const { children, isLoading: childrenLoading, error, getDisplayName } = useChildren();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [user, loading, router]);

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) router.push('/');
  };

  if (loading || childrenLoading) {
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
    <div className="flex min-h-screen flex-col items-center justify-between bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-3 sm:p-6 lg:p-8">
      <header className="w-full max-w-4xl flex justify-between items-center mb-4 px-2 sm:px-0">
        <div>
          <p className="text-gray-600 text-sm sm:text-lg">こんにちは、{user.displayName}さん</p>
        </div>
        <button
          onClick={handleLogout}
          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-500 text-white text-sm sm:text-base rounded-md hover:bg-red-600"
        >
          ログアウト
        </button>
      </header>

      <main className="flex w-full max-w-xl flex-1 flex-col items-center justify-center py-4 sm:py-8 px-2 sm:px-0">
        <h2 className="mb-6 sm:mb-8 text-center text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800">
          今日は誰がする？
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            エラー: {error}
          </div>
        )}

        {children.length === 0 ? (
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
          <div className="grid w-full grid-cols-1 gap-4">
            {children.map((child) => (
              <div key={child.id} className="relative">
                <Link href={`/children/confirm?childId=${child.id}`} className="block">
                  <Card className="flex h-full cursor-pointer flex-col justify-center rounded-xl bg-white/70 backdrop-blur-md p-4 sm:p-6 shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg border border-white/50">
                    <CardContent className="flex flex-col p-0">
                      <p className="text-lg sm:text-xl font-bold text-gray-700">
                        {child.nickname || child.name}
                      </p>
                      <p className="text-sm sm:text-md text-gray-500">{getDisplayName(child)}</p>
                    </CardContent>
                  </Card>
                </Link>
                <Link
                  href={`/children/edit/${child.id}`}
                  className="absolute top-2 right-2 bg-white/80 hover:bg-white text-gray-600 hover:text-gray-800 rounded-full p-2 shadow-md transition-all"
                >
                  ✏️
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="sticky bottom-0 z-10 mt-4 sm:mt-8 w-full max-w-4xl rounded-t-xl bg-white/90 p-3 sm:p-4 shadow-lg backdrop-blur-sm">
        <div className="flex flex-row justify-around gap-1 sm:gap-2">
          <Link href="/children/register" className="flex-1">
            <Button className="w-full bg-green-300 text-white hover:bg-green-400 px-2 sm:px-4 py-2 sm:py-2.5">
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
              <span className="text-xs sm:text-base">なまえをふやす</span>
            </Button>
          </Link>
          <Link href="/history" className="flex-1">
            <Button className="w-full bg-blue-300 text-white hover:bg-blue-400 px-2 sm:px-4 py-2 sm:py-2.5">
              <BarChart className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
              <span className="text-xs sm:text-base">ふりかえり</span>
            </Button>
          </Link>
          <Link href="/upgrade" className="flex-1">
            <Button className="w-full bg-yellow-300 text-white hover:bg-yellow-400 px-2 sm:px-4 py-2 sm:py-2.5">
              <Star className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
              <span className="text-xs sm:text-base">プレミアム</span>
            </Button>
          </Link>
        </div>
      </footer>
    </div>
  );
}
