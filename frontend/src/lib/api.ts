const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const api = {
  // ヘルスチェック
  health: async () => {
    try {
      const res = await fetch(`${API_URL}/health`);
      return res.json();
    } catch (error) {
      console.error('Health check failed:', error);
      return { status: 'error' };
    }
  },
  
  // 子ども管理
  children: {
    // 一覧取得
    list: async () => {
      try {
        const res = await fetch(`${API_URL}/children`);
        if (!res.ok) throw new Error('Failed to fetch children');
        return res.json();
      } catch (error) {
        console.error('子ども一覧の取得に失敗:', error);
        return [];
      }
    },
    
    // 新規登録
    create: async (data: { name: string; birthdate: string }) => {
      try {
        const res = await fetch(`${API_URL}/children`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to create child');
        return res.json();
      } catch (error) {
        console.error('子どもの登録に失敗:', error);
        throw error;
      }
    },
  },
};
