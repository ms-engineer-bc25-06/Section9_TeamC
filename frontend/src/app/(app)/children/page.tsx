'use client';

import { ChildCard } from '@/components/children/ChildCard';
import { NavigationFooter } from '@/components/children/NavigationFooter';
import { UserHeader } from '@/components/children/UserHeader';
import { useAuth } from '@/hooks/useAuth';
import { useChildren } from '@/hooks/useChildren';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Star } from 'lucide-react';
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
  const { displayUserName } = useUserProfile(user);

  const [children, setChildren] = useState<Child[]>([]);

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
        <UserHeader userName={displayUserName} onLogout={handleLogout} />

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

          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
            {children.map((child) => (
              <ChildCard key={child.id} child={child} />
            ))}
          </div>
        </main>

        <NavigationFooter />
      </div>
    </div>
  );
}
