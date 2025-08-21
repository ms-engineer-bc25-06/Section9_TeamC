'use client';

import { useChildren } from '@/hooks/useChildren';
import { useEffect } from 'react';

export default function DebugPage() {
  const { children, isLoading, error } = useChildren();

  useEffect(() => {
    if (!isLoading && children.length > 0) {
      console.log('🔍 === デバッグ情報 ===');
      children.forEach((child, index) => {
        console.log(`子ども ${index + 1}:`, {
          id: child.id,
          nickname: child.nickname,
          birthdate: child.birthdate,
          age: child.age,
          全データ: child,
        });
      });
    }
  }, [children, isLoading]);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">デバッグページ</h1>
      <div className="space-y-4">
        {children.map((child) => (
          <div key={child.id} className="border p-4 rounded">
            <p>ID: {child.id}</p>
            <p>ニックネーム: {child.nickname || '未設定'}</p>
            <p>birthdate: {child.birthdate || 'null'}</p>
            <p>age: {child.age !== undefined ? child.age : 'undefined'}</p>
            <details>
              <summary>全データ</summary>
              <pre className="text-xs">{JSON.stringify(child, null, 2)}</pre>
            </details>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-gray-500">
        ※ コンソールログも確認してください（F12 → Console）
      </p>
    </div>
  );
}
