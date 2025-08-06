import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';

// Interフォントを読み込み、サブセットを指定
const inter = Inter({ subsets: ['latin'] });

// アプリケーションのメタデータ
export const metadata: Metadata = {
  title: 'BUD - 子ども英語チャレンジサポート',
  description: '英語が苦手なママ向けの子ども英語チャレンジサポートアプリ',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>{children}</body>
    </html>
  );
}


