'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useChildren } from '@/hooks/useChildren';
import { api } from '@/lib/api';
import { BookOpen, Calendar, Edit3, Gem, Plus, Star, Trash2 } from 'lucide-react';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Child {
  id: string;
  name: string;
  age: number;
}

export default function ChildrenPage() {
  const { user, logout, loading } = useAuth();
  const { children: apiChildren, isLoading: childrenLoading, error } = useChildren();
  const router = useRouter();
  const [backendUserName, setBackendUserName] = useState<string>('');

  // ローカル状態（編集・追加用）
  const [children, setChildren] = useState<Child[]>([]);

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

  // API子どもデータを変換
  useEffect(() => {
    if (apiChildren) {
      const transformedChildren = apiChildren.map((child) => ({
        id: child.id.toString(), // string変換を追加
        name: child.nickname || child.name,
        age: child.birthdate
          ? new Date().getFullYear() - new Date(child.birthdate).getFullYear()
          : 0,
      }));
      setChildren(transformedChildren);
    }
  }, [apiChildren]);

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) router.push('/');
  };

  // 表示名を決定する関数
  const getDisplayUserName = () => {
    if (backendUserName) {
      return backendUserName;
    }
    if (user?.displayName) {
      return user.displayName;
    }
    if (user?.email) {
      return user.email.split('@')[0];
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-3 sm:p-6 lg:p-8">
      <div className="max-w-md mx-auto space-y-6">
        {/* ヘッダー */}
        <header className="w-full max-w-4xl flex justify-between items-center mb-4 px-2 sm:px-0">
          <div>
            <p className="text-gray-600 text-sm sm:text-lg">
              {getDisplayUserName()}さん、
              <br />
              お子さまを応援するよ！
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-500 text-white text-sm sm:text-base rounded-md hover:bg-red-600"
          >
            ログアウト
          </button>
        </header>

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            エラー: {error}
          </div>
        )}

        {/* メインコンテンツ */}
        <main className="flex w-full max-w-xl flex-1 flex-col items-center justify-center py-4 sm:py-8 px-2 sm:px-0">
          <h2 className="mb-6 sm:mb-8 text-center text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 flex items-center justify-center gap-3">
            <Star className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500 fill-yellow-500" />
            がんばってみよう
            <Star className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500 fill-yellow-500" />
          </h2>

          {/* 子ども一覧 */}
          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
            {children.map((child) => (
              <div key={child.id} className="relative">
                <Card className="flex h-full cursor-pointer flex-col justify-center rounded-xl bg-white/70 backdrop-blur-md p-4 sm:p-6 shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg border border-white/50">
                  <CardContent className="flex flex-col p-0 space-y-4">
                    {/* 子ども情報表示 */}
                    <div className="text-center">
                      <p className="text-lg sm:text-xl font-bold text-gray-700">{child.name}</p>
                      <div className="flex items-center justify-center space-x-2 mt-1">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-black font-medium">{child.age}歳</span>
                      </div>
                    </div>

                    {/* チャレンジボタン */}
                    <Button
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg py-3"
                      onClick={() => {
                        // チャレンジ画面への遷移
                        router.push(`/children/confirm?childId=${child.id}`);
                      }}
                    >
                      <Star className="w-4 h-4 mr-2" />
                      スタート
                    </Button>

                    {/* 編集・削除ボタン */}
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/children/edit/${child.id}`)}
                        className="flex-1"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                          if (confirm(`${child.name}を削除しますか？`)) {
                            try {
                              await api.children.delete(child.id);
                              window.location.reload(); // 削除後にリロード
                            } catch (error) {
                              console.error('削除エラー:', error);
                              alert('削除に失敗しました');
                            }
                          }
                        }}
                        className="flex-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </main>

        {/* フッターボタン群 */}
        <footer className="sticky bottom-0 z-10 mt-4 sm:mt-8 w-full max-w-4xl rounded-t-xl bg-white/90 p-2 sm:p-4 shadow-lg backdrop-blur-sm">
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:justify-around sm:gap-2">
            {/* 新しいチャレンジャー追加 */}
            <Button
              onClick={() => router.push('/children/register')}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-2 text-sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              なまえをつくる
            </Button>

            {/* 学習進捗 */}
            <Button
              variant="outline"
              onClick={() => router.push('/history')}
              className="w-full bg-white border-2 border-blue-300 hover:bg-blue-50 text-blue-700 font-semibold py-2 text-sm"
            >
              <BookOpen className="h-4 w-4 mr-1" />
              ふりかえり
            </Button>

            {/* アドバンスラーニング */}
            <Button
              variant="outline"
              onClick={() => router.push('/upgrade')}
              className="w-full bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 hover:bg-gradient-to-r hover:from-amber-100 hover:to-yellow-100 text-amber-700 font-semibold py-2 text-sm"
            >
              <Gem className="h-4 w-4 mr-1 text-amber-500" />
              ステップアップ
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
