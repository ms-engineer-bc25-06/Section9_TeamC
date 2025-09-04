import { ApiService } from '@/services/apiService';
import { API_CONFIG } from '@/constants/api';
import { logger } from '@/utils/logger';

const { ENDPOINTS } = API_CONFIG;

export const childrenApi = {
  list: async () => {
    try {
      return await ApiService.get(ENDPOINTS.CHILDREN.BASE);
    } catch (error) {
      logger.error('子ども一覧の取得に失敗:', error);
      return [];
    }
  },

  create: async (data: { name: string; nickname?: string; birthdate?: string }) => {
    try {
      return await ApiService.post(ENDPOINTS.CHILDREN.BASE, {
        nickname: data.name,
        birthdate: data.birthdate,
      });
    } catch (error) {
      logger.error('子どもの登録に失敗:', error);
      throw error;
    }
  },

  get: async (childId: string) => {
    try {
      return await ApiService.get(ENDPOINTS.CHILDREN.DETAIL(childId));
    } catch (error) {
      logger.error('子ども情報の取得に失敗:', error);
      throw error;
    }
  },

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
      logger.error('子ども情報の更新に失敗:', error);
      throw error;
    }
  },

  delete: async (childId: string) => {
    try {
      return await ApiService.delete(ENDPOINTS.CHILDREN.DETAIL(childId));
    } catch (error) {
      logger.error('子ども情報の削除に失敗:', error);
      throw error;
    }
  },
};
