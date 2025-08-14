'use client';

import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Child, ChildSelectionState } from '@/types';
import { useCallback, useEffect, useState } from 'react';

export function useChildren() {
  const { user, isAuthenticated, loading: authLoading } = useAuth(); // 追加

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
        console.log('⚠️ 認証されていません、モックデータを使用');
        // 認証されていない場合はモックデータ
        const mockChildren: Child[] = [
          { id: '1', name: 'ひなた', nickname: 'ひなたちゃん', age: 6, grade: '小学1年生' },
          { id: '2', name: 'さくら', nickname: 'さくらちゃん', age: 8, grade: '小学3年生' },
        ];

        setChildren(mockChildren);
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      console.log('🔍 認証済み、実APIを呼び出します');

      // api.children.list を使用して子ども一覧を取得
      const data = await api.children.list();
      console.log('✅ 実APIデータ:', data);

      // レスポンス処理
      if (Array.isArray(data) && data.length > 0) {
        setChildren(data);
      } else {
        // データが空の場合はモックデータ
        const mockChildren: Child[] = [
          { id: '1', name: 'ひなた', nickname: 'ひなたちゃん', age: 6, grade: '小学1年生' },
          { id: '2', name: 'さくら', nickname: 'さくらちゃん', age: 8, grade: '小学3年生' },
        ];
        setChildren(mockChildren);
      }

      setState((prev) => ({ ...prev, isLoading: false }));
    } catch (error) {
      console.error('❌ API取得失敗、モックデータにフォールバック:', error);

      // エラー時はモックデータ
      const mockChildren: Child[] = [
        { id: '1', name: 'ひなた', nickname: 'ひなたちゃん', age: 6, grade: '小学1年生' },
        { id: '2', name: 'さくら', nickname: 'さくらちゃん', age: 8, grade: '小学3年生' },
      ];

      setChildren(mockChildren);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: null,
      }));
    }
  }, [user, isAuthenticated, authLoading]); // 依存関係に追加

  // 他のメソッドは同じ...
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
    return `${name}（${child.age}歳）`;
  }, []);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  return {
    children,
    selectedChild: state.selectedChild,
    isLoading: state.isLoading || authLoading, // 認証ローディングも考慮
    error: state.error,
    selectChild,
    clearSelection,
    refreshChildren,
    getDisplayName,
  };
}
