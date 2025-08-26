/**
 * 子ども登録API
 * @param data 子どもの情報（ニックネーム、誕生日）
 * @param token Firebase認証トークン
 * @returns API レスポンス
 */
export async function createChild(data: { nickname: string; birthdate?: string }, token: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/children`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || '子ども登録に失敗しました');
  }

  return res.json();
}
