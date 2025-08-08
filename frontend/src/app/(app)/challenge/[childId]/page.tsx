'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart, Plus, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// 繧ｵ繝ｳ繝励Ν繝・・繧ｿ
const childrenData = [
  { id: '1', name: '縺ｲ縺ｪ縺・, age: 6, avatar: '/placeholder.svg' },
  { id: '2', name: '縺輔￥繧・, age: 8, avatar: '/placeholder.svg' },
  // 蠢・ｦ√↓蠢懊§縺ｦ縺輔ｉ縺ｫ蟄舌←繧ゅｒ霑ｽ蜉
];

export default function ChildrenSelectionPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 sm:p-6 lg:p-8">
      <main className="flex w-full max-w-4xl flex-1 flex-col items-center justify-center py-8">
        <h1 className="mb-8 text-center text-3xl font-bold text-gray-800 sm:text-4xl md:text-5xl">
          莉頑律縺ｯ隱ｰ縺後メ繝｣繝ｬ繝ｳ繧ｸ縺吶ｋ・・
        </h1>

        <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {childrenData.map((child, index) => (
            // 蟄舌←繧ゅき繝ｼ繝峨・繝ｪ繝ｳ繧ｯ縺ｯ縺昴・縺ｾ縺ｾ
            <Link href={`/children/confirm?childId=${child.id}`} key={child.id} className="block">
              <Card className="flex h-full cursor-pointer flex-col items-center justify-center rounded-xl bg-white/80 p-4 text-center shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg">
                <CardContent className="flex flex-col items-center p-0">
                  <div className="mb-4 h-24 w-24 overflow-hidden rounded-full border-4 border-pink-200 bg-gray-100">
                    <Image
                      src={child.avatar || '/placeholder.svg'}
                      alt={`${child.name}縺｡繧・ｓ縺ｮ蜀咏悄`}
                      width={96}
                      height={96}
                      className="h-full w-full object-cover"
                      priority={index < 2}
                    />
                  </div>
                  <p className="text-xl font-semibold text-gray-700 sm:text-2xl">
                    {child.name}縺｡繧・ｓ
                  </p>
                  <p className="text-md text-gray-500 sm:text-lg">・・child.age}豁ｳ・・/p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>

      <footer className="sticky bottom-0 z-10 mt-8 w-full max-w-4xl rounded-t-xl bg-white/90 p-4 shadow-lg backdrop-blur-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-around">
          {/* 菫ｮ豁｣邂・園: Button縺ｫasChild繧定ｿｽ蜉縺励´ink繧貞ｭ占ｦ∫ｴ縺ｫ縺吶ｋ */}
          <Button
            asChild
            className="flex-1 py-3 text-lg sm:py-4 sm:text-xl font-semibold rounded-full shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400 bg-green-300 text-white hover:bg-green-400 w-full"
          >
            <Link href="/children/register">
              <Plus className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
              縺雁ｭ舌＆縺ｾ繧定ｿｽ蜉
            </Link>
          </Button>
          <Button
            asChild
            className="flex-1 py-3 text-lg sm:py-4 sm:text-xl font-semibold rounded-full shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 bg-blue-300 text-white hover:bg-blue-400 w-full"
          >
            <Link href="/history">
              <BarChart className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
              繝√Ε繝ｬ繝ｳ繧ｸ螻･豁ｴ
            </Link>
          </Button>
          <Button
            asChild
            className="flex-1 py-3 text-lg sm:py-4 sm:text-xl font-semibold rounded-full shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 bg-yellow-300 text-white hover:bg-yellow-400 w-full"
          >
            <Link href="/upgrade">
              <Star className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
              繝励Ξ繝溘い繝繝励Λ繝ｳ
            </Link>
          </Button>
        </div>
      </footer>
    </div>
  );
}




