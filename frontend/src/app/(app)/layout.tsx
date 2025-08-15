// frontend/src/app/(app)/layout.tsx - 認証機能有効化版

'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 認証状態の確定後にチェック
    if (!loading) {
      if (!isAuthenticated || !user) {
        console.log('❌ 未認証のため、ログイン画面にリダイレクト');
        router.push('/');
        return;
      }

      console.log('✅ 認証済み:', user.email);
    }
  }, [isAuthenticated, user, loading, router]);

  // ローディング中は読み込み画面を表示
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">認証状態を確認中...</p>
        </div>
      </div>
    );
  }

  // 未認証の場合は何も表示しない（リダイレクト中）
  if (!isAuthenticated || !user) {
    return null;
  }

  // 認証済みの場合のみ子ページを表示
  return <>{children}</>;
}
