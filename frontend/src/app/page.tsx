'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Chrome } from 'lucide-react'; // GoogleログインのアイコンとしてChromeを使用

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    console.log('Googleログインボタンがクリックされました');

    // デモ用：2秒後にローディング解除
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-sm sm:p-8 md:p-10 text-center space-y-8">
        <div className="flex justify-center">
          <Image
            src="/images/logo.png"
            alt="BUDアプリのロゴ：英国旗とテキストアイコンの吹き出し、芽生え"
            width={200}
            height={200}
            className="object-contain"
            priority // ロゴをすぐに読み込む
          />
        </div>

        <h1 className="text-3xl font-bold text-gray-800 sm:text-4xl">BUDへようこそ！</h1>

        <p className="text-lg text-gray-600 sm:text-xl">お子様と一緒に英語を楽しく学びましょう</p>

        <Button
          className="w-full py-3 text-lg sm:py-4 sm:text-xl font-semibold rounded-full shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 bg-blue-300 text-white hover:bg-blue-400"
          size="lg"
        >
          {isLoading ? (
            <span className="animate-pulse">ログインちゅう...</span>
          ) : (
            <>
              <Chrome className="mr-3 h-6 w-6 sm:h-7 sm:w-7" />
              Googleでログイン
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
