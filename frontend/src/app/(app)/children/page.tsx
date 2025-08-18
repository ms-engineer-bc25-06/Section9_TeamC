'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useChildren } from '@/hooks/useChildren';
import { api } from '@/lib/api';
import { BarChart, Plus, Star } from 'lucide-react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ChildrenPage() {
  const { user, logout, loading } = useAuth();
  const { children, isLoading: childrenLoading, error, getDisplayName } = useChildren();
  const router = useRouter();
  const [backendUserName, setBackendUserName] = useState<string>('');

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [user, loading, router]);

  // バックエンドから正式な名前を取得
  useEffect(() => {
    const fetchUserName = async () => {
      if (user && !backendUserName) {
        try {
          console.log('🔍 バックエンドから名前を取得中...');
          const authTest = await api.auth.test();
          console.log('✅ バックエンドレスポンス:', authTest);

          if (authTest.name) {
            setBackendUserName(authTest.name);
            console.log('💾 名前を設定:', authTest.name);
          }
        } catch (error) {
          console.error('❌ 名前取得エラー:', error);
          // エラーの場合はFirebaseの情報にフォールバック
          console.log('🔄 Firebaseの情報にフォールバック');
        }
      }
    };

    fetchUserName();
  }, [user, backendUserName]);

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) router.push('/');
  };

  // 表示名を決定する関数
  const getDisplayUserName = () => {
    if (backendUserName) {
      return backendUserName; // 'ryoko sasagawa'
    }
    if (user?.displayName) {
      return user.displayName;
    }
    if (user?.email) {
      return user.email.split('@')[0]; // 'sasaryo0929'
    }
    return 'ユーザー';
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
    <div className="flex min-h-screen flex-col items-center justify-between bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-4xl flex justify-between items-center mb-4">
        <div>
          {/* バックエンドの正式名前を表示 */}
          <p className="text-gray-600 text-lg">こんにちは、{getDisplayUserName()}さん</p>

          {/* デバッグ用（後で削除可能） */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-400 mt-1">
              <p>Backend Name: {backendUserName || 'loading...'}</p>
              <p>Firebase Name: {user?.displayName || 'undefined'}</p>
              <p>Email: {user?.email || 'undefined'}</p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
        >
          ログアウト
        </button>
      </header>

      <main className="flex w-full max-w-xl flex-1 flex-col items-center justify-center py-8">
        <h2 className="mb-8 text-center text-3xl font-bold text-gray-800 sm:text-4xl md:text-5xl">
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
                  <Card className="flex h-full cursor-pointer flex-col justify-center rounded-xl bg-white/70 backdrop-blur-md p-6 shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg border border-white/50">
                    <CardContent className="flex flex-col p-0">
                      <p className="text-xl font-bold text-gray-700">
                        {child.nickname || child.name}ちゃん
                      </p>
                      <p className="text-md text-gray-500">{getDisplayName(child)}</p>
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

      <footer className="sticky bottom-0 z-10 mt-8 w-full max-w-4xl rounded-t-xl bg-white/90 p-4 shadow-lg backdrop-blur-sm sm:p-6">
        <div className="flex flex-row justify-around gap-2">
          <Link href="/children/register">
            <Button className="w-full bg-green-300 text-white hover:bg-green-400">
              <Plus className="mr-2 h-5 w-5" />
              <span className="hidden sm:inline">なまえをふやす</span>
            </Button>
          </Link>
          <Link href="/history">
            <Button className="w-full bg-blue-300 text-white hover:bg-blue-400">
              <BarChart className="hidden sm:inline" />
              <span className="hidden sm:inline">ふりかえり</span>
            </Button>
          </Link>
          <Link href="/upgrade">
            <Button className="w-full bg-yellow-300 text-white hover:bg-yellow-400">
              <Star className="mr-2 h-5 w-5" />
              <span className="hidden sm:inline">プレミアムプラン</span>
            </Button>
          </Link>
        </div>
      </footer>
    </div>
  );
}
