'use client';

import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Child, ChildSelectionState } from '@/types';
import { useCallback, useEffect, useState } from 'react';

// APIレスポンス用の型定義
interface ApiChildResponse {
  id: string;
  name: string;
  nickname?: string;
  birth_date?: string; // APIが返すフィールド名
  created_at?: string;
  updated_at?: string;
}

// 年齢計算関数
const calculateAge = (birthdate: string): number => {
  const today = new Date();
  const birth = new Date(birthdate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
};

export function useChildren() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [state, setState] = useState<ChildSelectionState>({
    selectedChild: null,
    isLoading: true,
    error: null,
  });

  const [children, setChildren] = useState<Child[]>([]);

  const fetchChildren = useCallback(async () => {
    // 認証ローディング中は待機
    if (authLoading) {
      console.log('🔄 認証ローディング中、待機します');
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('🔍 useChildren: 認証状態確認');
      console.log('🔍 useAuth user:', user);
      console.log('🔍 useAuth isAuthenticated:', isAuthenticated);

      if (!isAuthenticated || !user) {
        console.log('⚠️ 認証されていません、空のデータを使用');
        setChildren([]);
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      console.log('🔍 認証済み、実APIを呼び出します');

      // api.children.list を使用して子ども一覧を取得
      const data = await api.children.list();
      console.log('✅ 実APIデータ:', data);

      // データ処理：年齢を計算（birth_date フィールドを使用 - APIが返すフィールド名）
      const processedChildren = data.map((child: ApiChildResponse, index: number) => {
        console.log(`🔍 子ども${index + 1}の生データ:`, {
          birth_date: child.birth_date,
          型: typeof child.birth_date,
          値: child.birth_date,
        });

        const age = child.birth_date ? calculateAge(child.birth_date) : undefined;
        console.log(`📅 年齢計算結果: birth_date=${child.birth_date} → age=${age}`);

        return {
          ...child,
          birthdate: child.birth_date, // APIのbirth_dateをbirthdateに正規化
          age,
        };
      });

      // デバッグ用ログ
      console.log('📊 処理済みデータ:', processedChildren);

      setChildren(processedChildren);
      setState((prev) => ({ ...prev, isLoading: false }));
    } catch (error) {
      console.error('❌ API取得失敗:', error);

      // エラー時は空配列
      setChildren([]);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'データの取得に失敗しました',
      }));
    }
  }, [user, isAuthenticated, authLoading]);

  const selectChild = useCallback((child: Child) => {
    setState((prev) => ({
      ...prev,
      selectedChild: child,
      error: null,
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedChild: null,
      error: null,
    }));
  }, []);

  const refreshChildren = useCallback(async () => {
    await fetchChildren();
  }, [fetchChildren]);

  const getDisplayName = useCallback((child: Child): string => {
    return child.age ? `${child.age}歳` : '年齢未設定';
  }, []);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  return {
    children,
    selectedChild: state.selectedChild,
    isLoading: state.isLoading || authLoading,
    error: state.error,
    selectChild,
    clearSelection,
    refreshChildren,
    getDisplayName,
  };
}
