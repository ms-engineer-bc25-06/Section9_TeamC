'use client';

import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Child, ChildSelectionState } from '@/types';
import { useCallback, useEffect, useState } from 'react';

/**
 * APIから取得する子どもデータの型定義
 */
type ApiChild = {
  id: string;
  name: string;
  nickname?: string;
  birthdate?: string;
  grade?: string;
  created_at?: string;
  updated_at?: string;
};

/**
 * 年齢計算関数
 * @param birthdate 誕生日（YYYY-MM-DD形式）
 * @returns 年齢
 */
const calculateAge = (birthdate: string): number => {
  const today = new Date();
  const birth = new Date(birthdate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  // 誕生日がまだ来ていない場合は1歳引く
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
};

export function useChildren() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  // 子ども選択状態の管理
  const [state, setState] = useState<ChildSelectionState>({
    selectedChild: null,
    isLoading: true,
    error: null,
  });

  // 子どもリストの状態管理
  const [children, setChildren] = useState<Child[]>([]);

  /**
   * 子どもリストをAPIから取得
   */
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

      // 未認証の場合は空のリストを返す
      if (!isAuthenticated || !user) {
        console.log('⚠️ 認証されていません、空のデータを使用');
        setChildren([]);
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      console.log('🔍 認証済み、実APIを呼び出します');

      // APIから子どもリストを取得
      const data: ApiChild[] = await api.children.list();
      console.log('✅ 実APIデータ:', data);

      // データを処理して年齢を計算
      const processedChildren: Child[] = data.map((child: ApiChild, index: number): Child => {
        console.log(`🔍 子ども${index + 1}の生データ:`, {
          birthdate: child.birthdate,
          型: typeof child.birthdate,
          値: child.birthdate,
        });

        const birthdate = child.birthdate ?? undefined;
        const age = birthdate ? calculateAge(birthdate) : undefined;

        return {
          id: child.id,
          name: child.name,
          nickname: child.nickname,
          birthdate,
          age,
          grade: child.grade,
          created_at: child.created_at,
          updated_at: child.updated_at,
        };
      });

      console.log('📊 処理済みデータ:', processedChildren);

      setChildren(processedChildren);
      setState((prev) => ({ ...prev, isLoading: false }));
    } catch (error) {
      console.error('❌ API取得失敗:', error);

      // エラー時は空配列をセット
      setChildren([]);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'データの取得に失敗しました',
      }));
    }
  }, [user, isAuthenticated, authLoading]);

  /**
   * 子どもを選択
   */
  const selectChild = useCallback((child: Child) => {
    setState((prev) => ({
      ...prev,
      selectedChild: child,
      error: null,
    }));
  }, []);

  /**
   * 子どもの選択をクリア
   */
  const clearSelection = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedChild: null,
      error: null,
    }));
  }, []);

  /**
   * 子どもリストを再取得
   */
  const refreshChildren = useCallback(async () => {
    await fetchChildren();
  }, [fetchChildren]);

  /**
   * 表示用の名前を取得（年齢付き）
   */
  const getDisplayName = useCallback((child: Child): string => {
    return child.age ? `${child.age}歳` : '年齢未設定';
  }, []);

  // 初回ロード時に子どもリストを取得
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
