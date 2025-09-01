/**
 * 子ども登録API
 * @param data 子どもの情報（ニックネーム、誕生日）
 * @param token Firebase認証トークン
 * @returns API レスポンス
 */

import { api } from '@/lib/api';

export const createChild = async (
  data: { nickname: string; birthdate?: string },
  token?: string
) => {
  return api.children.create({
    name: data.nickname,
    nickname: data.nickname,
    birthdate: data.birthdate,
  });
};