// 認証サービス実装 - 依存性注入対応

import { IAuthService } from '../DIContainer';

export class AuthServiceImpl implements IAuthService {
  async getHeaders(): Promise<Record<string, string>> {
    try {
      // Firebase Authからトークンを取得
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const user = auth.currentUser;

      if (user) {
        const token = await user.getIdToken();
        return {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        };
      }

      return { 'Content-Type': 'application/json' };
    } catch (error) {
      console.error('認証ヘッダー取得エラー:', error);
      return { 'Content-Type': 'application/json' };
    }
  }

  async getCurrentUser(): Promise<any> {
    try {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      return auth.currentUser;
    } catch (error) {
      console.error('現在のユーザー取得エラー:', error);
      return null;
    }
  }

  isAuthenticated(): boolean {
    try {
      const { getAuth } = require('firebase/auth');
      const auth = getAuth();
      return !!auth.currentUser;
    } catch {
      return false;
    }
  }
}