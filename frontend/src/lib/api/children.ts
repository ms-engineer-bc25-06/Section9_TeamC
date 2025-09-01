import { getAuthHeaders } from './auth';

const API_URL = 'http://localhost:8000';

export const childrenApi = {
  // 子ども一覧取得
  list: async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/api/children`, {
        method: 'GET',
        headers,
      });
      if (!response.ok) throw new Error('Failed to fetch children');
      return response.json();
    } catch (error) {
      console.error('子ども一覧の取得に失敗:', error);
      return [];
    }
  },

  // 子ども登録
  create: async (data: { name: string; nickname?: string; birthdate?: string }) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/api/children`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          nickname: data.name,
          birthdate: data.birthdate,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create child');
      }
      return response.json();
    } catch (error) {
      console.error('子どもの登録に失敗:', error);
      throw error;
    }
  },

  // 子ども詳細取得
  get: async (childId: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/api/children/${childId}`, {
        method: 'GET',
        headers,
      });
      if (!response.ok) throw new Error('Failed to fetch child');
      return response.json();
    } catch (error) {
      console.error('子ども情報の取得に失敗:', error);
      throw error;
    }
  },

  // 子ども情報更新
  update: async (
    childId: string,
    data: { name?: string; nickname?: string; birthdate?: string }
  ) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/api/children/${childId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          nickname: data.name || data.nickname,
          birthdate: data.birthdate,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update child');
      }
      return response.json();
    } catch (error) {
      console.error('子ども情報の更新に失敗:', error);
      throw error;
    }
  },

  // 子ども削除
  delete: async (childId: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/api/children/${childId}`, {
        method: 'DELETE',
        headers,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete child');
      }
      return response.json();
    } catch (error) {
      console.error('子ども情報の削除に失敗:', error);
      throw error;
    }
  },
};