'use client';

import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useState } from 'react';

export function useLoginFlow() {
  const { loginWithGoogle, loginWithAccountSelection } = useAuth();
  const [backendLoading, setBackendLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setBackendLoading(true);

      const result = await loginWithGoogle();
      if (result.success) {
        console.log('🎉 Firebase認証成功:', result.user?.displayName);

        try {
          console.log('🔄 バックエンド連携開始...');
          const backendResult = await api.auth.login();
          console.log('✅ バックエンド連携成功:', backendResult);

          try {
            const testResult = await api.auth.test();
            console.log('🧪 認証テスト成功:', testResult);
          } catch (testError) {
            console.warn('⚠️ 認証テストは失敗しましたが、ログインは成功しています:', testError);
          }

          const userName =
            result.user?.displayName || result.user?.email?.split('@')[0] || 'ユーザー';

          alert(`ログイン完了！${userName}さん、BUDへようこそ 🌱`);
        } catch (backendError) {
          console.error('❌ バックエンド連携失敗:', backendError);
          console.log('ログインに問題が発生しましたが、引き続きアプリをご利用いただけます 😊');
          console.error('詳細なエラー情報:', backendError);
        }
      } else {
        console.error('❌ Firebase認証失敗:', result.error);
        console.log('ログインできませんでした。もう一度お試しください 🙏');
        console.error('詳細なエラー情報:', result.error);
      }
    } catch (error) {
      console.error('❌ ログイン処理全体でエラー:', error);
      console.log('申し訳ございません。しばらく後にもう一度お試しください 🙇‍♀️');
      console.error('詳細なエラー情報:', error);
    } finally {
      setBackendLoading(false);
    }
  };

  const handleSwitchAccount = async () => {
    try {
      setBackendLoading(true);

      await signOut(auth);

      const result = await loginWithAccountSelection();

      if (result.success) {
        console.log('🎉 Firebase認証成功:', result.user?.displayName);

        try {
          console.log('🔄 バックエンド連携開始...');
          const backendResult = await api.auth.login();
          console.log('✅ バックエンド連携成功:', backendResult);

          const userName =
            result.user?.displayName || result.user?.email?.split('@')[0] || 'ユーザー';

          alert(`アカウント切り替え完了！${userName}さん、BUDへようこそ 🌱`);
        } catch (backendError) {
          console.error('❌ バックエンド連携失敗:', backendError);
          console.log('ログインに問題が発生しましたが、引き続きアプリをご利用いただけます 😊');
        }
      } else {
        console.log('アカウント切り替えをキャンセルしました');
      }
    } catch (error) {
      console.error('❌ アカウント切り替えエラー:', error);
      console.log('アカウント切り替えに失敗しました。もう一度お試しください 🙏');
    } finally {
      setBackendLoading(false);
    }
  };

  return {
    handleGoogleLogin,
    handleSwitchAccount,
    backendLoading,
  };
}
