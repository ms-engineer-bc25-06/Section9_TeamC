'use client';

import { AccountSwitcher } from '@/components/auth/AccountSwitcher';
import { AppFeatures } from '@/components/auth/AppFeatures';
import { LoginButton } from '@/components/auth/LoginButton';
import { NewUserInfo } from '@/components/auth/NewUserInfo';
import { useAuth } from '@/hooks/useAuth';
import { useLoginFlow } from '@/hooks/useLoginFlow';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { handleGoogleLogin, handleSwitchAccount, backendLoading } = useLoginFlow();

  // 既にログイン済みの場合はアプリページにリダイレクト
  useEffect(() => {
    if (user) {
      router.push('/children');
    }
  }, [user, router]);

  if (loading || backendLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100">
        <div className="animate-pulse text-xl" aria-busy={loading || backendLoading} role="status">
          {loading ? '確認中...' : 'ログイン中...'}
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100">
        <div className="text-xl">移動中...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100">
      <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-sm w-full mx-4">
        <div className="text-center">
          <div className="mb-8"></div>

          <h1 className="text-4xl font-bold text-green-600 mb-2">BUD</h1>
          <p className="text-gray-600 text-sm">お子様の英語の芽を育てよう！</p>

          <Image
            src="/logo.png"
            alt="BUD Logo"
            width={250}
            height={Math.round(250 / 1.76)}
            priority
            className="mx-auto mb-4 rounded-full"
          />
        </div>

        <AppFeatures />

        <NewUserInfo />

        <div className="space-y-4">
          <LoginButton onLogin={handleGoogleLogin} loading={backendLoading} />
          <AccountSwitcher onSwitchAccount={handleSwitchAccount} loading={backendLoading} />
        </div>

        <p className="text-[10px] text-gray-400 mt-4 text-center px-4 break-words">
          ログインすると、
          <a href="/terms" className="text-blue-500 underline">
            利用規約
          </a>
          と
          <a href="/privacy" className="text-blue-500 underline">
            プライバシーポリシー
          </a>
          に同意したことになります。安心してご利用ください。
        </p>
      </div>
    </div>
  );
}
// husky test comment
