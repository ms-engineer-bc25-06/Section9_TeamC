'use client';

import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart, Plus, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// サンプルデータ
const childrenData = [
  { id: '1', name: 'ひなた', age: 6, avatar: '/placeholder.svg' },
  { id: '2', name: 'さくら', age: 8, avatar: '/placeholder.svg' },
  // 必要に応じてさらに子どもを追加
];

export default function ChildrenSelectionPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 sm:p-6 lg:p-8">
      <main className="flex w-full max-w-4xl flex-1 flex-col items-center justify-center py-8">
        <h1 className="mb-8 text-center text-3xl font-bold text-gray-800 sm:text-4xl md:text-5xl">
          今日は誰がチャレンジする？
        </h1>

        <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {childrenData.map((child, index) => (
            // 子どもカードのリンクはそのまま
            <Link href={`/children/confirm?childId=${child.id}`} key={child.id} className="block">
              <Card className="flex h-full cursor-pointer flex-col items-center justify-center rounded-xl bg-white/80 p-4 text-center shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg">
                <CardContent className="flex flex-col items-center p-0">
                  <div className="mb-4 h-24 w-24 overflow-hidden rounded-full border-4 border-pink-200 bg-gray-100">
                    <Image
                      src={child.avatar || '/placeholder.svg'}
                      alt={`${child.name}ちゃんの写真`}
                      width={96}
                      height={96}
                      className="h-full w-full object-cover"
                      priority={index < 2}
                    />
                  </div>
                  <p className="text-xl font-semibold text-gray-700 sm:text-2xl">
                    {child.name}ちゃん
                  </p>
                  <p className="text-md text-gray-500 sm:text-lg">（{child.age}歳）</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>

      <footer className="sticky bottom-0 z-10 mt-8 w-full max-w-4xl rounded-t-xl bg-white/90 p-4 shadow-lg backdrop-blur-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-around">
          {/* 修正箇所: ButtonにasChildを追加し、Linkを子要素にする */}
          <Button
            asChild
            className="flex-1 py-3 text-lg sm:py-4 sm:text-xl font-semibold rounded-full shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400 bg-green-300 text-white hover:bg-green-400 w-full"
          >
            <Link href="/children/register">
              <Plus className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
              お子さまを追加
            </Link>
          </Button>
          <Button
            asChild
            className="flex-1 py-3 text-lg sm:py-4 sm:text-xl font-semibold rounded-full shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 bg-blue-300 text-white hover:bg-blue-400 w-full"
          >
            <Link href="/history">
              <BarChart className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
              チャレンジ履歴
            </Link>
          </Button>
          <Button
            asChild
            className="flex-1 py-3 text-lg sm:py-4 sm:text-xl font-semibold rounded-full shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 bg-yellow-300 text-white hover:bg-yellow-400 w-full"
          >
            <Link href="/upgrade">
              <Star className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
              プレミアムプラン
            </Link>
          </Button>
        </div>
      </footer>
    </div>
  );
}
