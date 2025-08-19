'use client';

import { auth } from '@/lib/firebase';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import { useEffect, useState } from 'react';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Google login failed:', error);
      return { success: false, error };
    }
  };

  // 🆕 アカウント切り替え用ログイン関数
  const loginWithAccountSelection = async () => {
    try {
      const provider = new GoogleAuthProvider();
      // 🔑 強制的にアカウント選択画面を表示
      provider.setCustomParameters({
        prompt: 'select_account',
      });
      const result = await signInWithPopup(auth, provider);
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Account selection login failed:', error);
      return { success: false, error };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      console.error('Logout failed:', error);
      return { success: false, error };
    }
  };

  return {
    user,
    loading,
    loginWithGoogle,
    loginWithAccountSelection, // 🆕 新しい関数を追加
    logout,
    isAuthenticated: !!user,
  };
}
