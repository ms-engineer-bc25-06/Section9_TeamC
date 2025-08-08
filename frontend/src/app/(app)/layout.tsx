import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

export default async function AppLayout({ children }: { children: ReactNode }) {
  // TODO: 認証機能が完成したら以下のコメントを外す
  // 開発中は認証をスキップしています
  /*
  const cookieStore = await cookies();
  const token = cookieStore.get('__session')?.value;

  if (!token) {
    redirect('/');
  }

  // とりあえずトークンの存在だけで認証済み扱い（あとで差し替え）
  const isValid = await verifyIdToken(token);

  if (!isValid) {
    redirect('/');
  }
  */

  return <div>{children}</div>;
}

// TODO: 認証機能で使用する関数（現在は未使用）
async function verifyIdToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  console.warn('verifyIdToken: 現状は常にtrueを返しています。後で実装してください。');
  return true;
}
