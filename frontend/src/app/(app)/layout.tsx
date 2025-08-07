import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const cookieStore = cookies();
  const token = cookieStore.get('__session')?.value;

  if (!token) {
    redirect('/login');
  }

  // とりあえずトークンの存在だけで認証済み扱い（あとで差し替え）
  const isValid = await verifyIdToken(token);

  if (!isValid) {
    redirect('/login');
  }

  return <div>{children}</div>;
}

async function verifyIdToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  console.warn('verifyIdToken: 現状は常にtrueを返しています。後で実装してください。');
  return true;
}
