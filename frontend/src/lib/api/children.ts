import { ApiService } from '@/services/apiService';
import { API_CONFIG } from '@/constants/api';

const { ENDPOINTS } = API_CONFIG;

export const childrenApi = {
  // 子ども一覧取得
  list: async () => {
    try {
      return await ApiService.get(ENDPOINTS.CHILDREN.BASE);
    } catch (error) {
      console.error('子ども一覧の取得に失敗:', error);
      return [];
    }
  },

  // 子ども登録
  create: async (data: { name: string; nickname?: string; birthdate?: string }) => {
    try {
      return await ApiService.post(ENDPOINTS.CHILDREN.BASE, {
        nickname: data.name,
        birthdate: data.birthdate,
      });
    } catch (error) {
      console.error('子どもの登録に失敗:', error);
      throw error;
    }
  },

  // 子ども詳細取得
  get: async (childId: string) => {
    try {
      return await ApiService.get(ENDPOINTS.CHILDREN.DETAIL(childId));
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
      return await ApiService.put(ENDPOINTS.CHILDREN.DETAIL(childId), {
        nickname: data.name || data.nickname,
        birthdate: data.birthdate,
      });
    } catch (error) {
      console.error('子ども情報の更新に失敗:', error);
      throw error;
    }
  },

  // 子ども削除
  delete: async (childId: string) => {
    try {
      return await ApiService.delete(ENDPOINTS.CHILDREN.DETAIL(childId));
    } catch (error) {
      console.error('子ども情報の削除に失敗:', error);
      throw error;
    }
  },
};