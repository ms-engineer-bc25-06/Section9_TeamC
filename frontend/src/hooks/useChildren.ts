'use client';

import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Child, ChildSelectionState } from '@/types';
import { useCallback, useEffect, useState } from 'react';

//APIのレスポンス型（サーバーのsnake_caseに合わせる）
type ApiChild = {
  id: string;
  name: string;
  nickname?: string;
  birth_date?: string;
  grade?: string;
  created_at?: string;
  updated_at?: string;
};

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
      const data: ApiChild[] = await api.children.list();
      console.log('✅ 実APIデータ:', data);

      // APIの birth_date(snake_case) → フロントの birthdate(camelCase) に正規化
      const processedChildren: Child[] = data.map((child: ApiChild, index: number): Child => {
        console.log(`🔍 子ども${index + 1}の生データ:`, {
          birth_date: child.birth_date,
          型: typeof child.birth_date,
          値: child.birth_date,
        });

        // 🟢 正規化後の birthdate を使って年齢を計算
        const birthdate = child.birth_date ?? undefined;
        const age = birthdate ? calculateAge(birthdate) : undefined;

        return {
          id: child.id,
          name: child.name,
          nickname: child.nickname,
          birthdate, // 🟢 APIの birth_date を birthdate に変換
          age,
          grade: child.grade,
          created_at: child.created_at,
          updated_at: child.updated_at,
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
