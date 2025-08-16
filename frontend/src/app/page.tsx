'use client';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Home() {
  const { user, loginWithGoogle, loading } = useAuth();
  const router = useRouter();
  const [backendLoading, setBackendLoading] = useState(false);

  // 既にログイン済みの場合はアプリページにリダイレクト
  useEffect(() => {
    if (user) {
      router.push('/children');
    }
  }, [user, router]);

  const handleGoogleLogin = async () => {
    try {
      setBackendLoading(true);

      // Step 1: Firebase認証
      const result = await loginWithGoogle();
      if (result.success) {
        console.log('🎉 Firebase認証成功:', result.user?.displayName);

        // Step 2: バックエンドAPI連携
        try {
          console.log('🔄 バックエンド連携開始...');
          const backendResult = await api.auth.login();
          console.log('✅ バックエンド連携成功:', backendResult);

          // Step 3: 認証テスト（任意）
          try {
            const testResult = await api.auth.test();
            console.log('🧪 認証テスト成功:', testResult);
          } catch (testError) {
            console.warn('⚠️ 認証テストは失敗しましたが、ログインは成功しています:', testError);
          }

          // Step 4: 成功メッセージ表示
          alert(
            `🎊 ログイン完了！\n\nFirebase: ${result.user?.displayName}\nバックエンド: ${backendResult.message}`
          );
        } catch (backendError) {
          console.error('❌ バックエンド連携失敗:', backendError);
          const errorMessage =
            backendError instanceof Error ? backendError.message : '不明なエラー';
          alert(
            `⚠️ Firebase認証は成功しましたが、バックエンド連携に失敗しました。\n\nエラー: ${errorMessage}\n\n引き続きアプリは利用できます。`
          );
        }
      } else {
        console.error('❌ Firebase認証失敗:', result.error);
        alert(`ログインに失敗しました：${result.error}`);
      }
    } catch (error) {
      console.error('❌ ログイン処理全体でエラー:', error);
      const errorMessage = error instanceof Error ? error.message : '不明なエラー';
      alert(`予期しないエラーが発生しました：${errorMessage}`);
    } finally {
      setBackendLoading(false);
    }
  };

  if (loading || backendLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100">
        <div className="animate-pulse text-xl" aria-busy={loading || backendLoading} role="status">
          {loading ? '🔄 認証状態を確認中...' : '🔗 バックエンドと連携中...'}
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100">
        <div className="text-xl">🔄 アプリページに移動中...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">BUD</h1>
          <h2 className="text-xl text-gray-600 mb-8">へようこそ！</h2>

          <p className="text-gray-500 mb-8">お子様と一緒に英語を楽しみましょう</p>

          <button
            onClick={handleGoogleLogin}
            disabled={backendLoading}
            aria-label="Googleでログイン"
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {backendLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                連携中...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Googleでログイン
              </>
            )}
          </button>

          <div className="mt-6 text-sm text-gray-400">
            <p>🔒 安全にログインできます</p>
            <p>Firebase認証 + バックエンド連携</p>
          </div>
        </div>
      </div>
    </div>
  );
}
