'use client';

import { api } from '@/lib/api';
import { User } from 'firebase/auth';
import { useEffect, useState } from 'react';

export function useUserProfile(user: User | null) {
  const [backendUserName, setBackendUserName] = useState<string>('');

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
          console.log('🔄 Firebaseの情報にフォールバック');
        }
      }
    };

    fetchUserName();
  }, [user, backendUserName]);

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

  return { displayUserName: getDisplayUserName() };
}