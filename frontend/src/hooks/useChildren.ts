'use client';

import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Child, ChildSelectionState } from '@/types';
import { useCallback, useEffect, useState } from 'react';

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

// 学年推定関数（オプション）
const estimateGrade = (age: number): string => {
  if (age >= 6 && age <= 12) {
    return `小学${age - 5}年生`;
  }
  return '未就学';
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

      // データ処理：年齢と学年を計算
      const processedChildren = data.map((child: any) => ({
        ...child,
        age: child.birthdate ? calculateAge(child.birthdate) : undefined,
        grade: child.birthdate ? estimateGrade(calculateAge(child.birthdate)) : undefined,
      }));

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
    const name = child.nickname || child.name;
    const age = child.age ? `（${child.age}歳）` : '';
    return `${name}${age}`;
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