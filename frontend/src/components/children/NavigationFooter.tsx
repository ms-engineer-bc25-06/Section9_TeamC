'use client';

import { Button } from '@/components/ui/button';
import { BookOpen, Gem, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function NavigationFooter() {
  const router = useRouter();

  return (
    <footer className="sticky bottom-0 z-10 mt-4 sm:mt-8 w-full max-w-4xl rounded-t-xl bg-white/90 p-2 sm:p-4 shadow-lg backdrop-blur-sm">
      <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:justify-around sm:gap-2">
        <Button
          onClick={() => router.push('/children/register')}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-2 text-sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          なまえをつくる
        </Button>

        <Button
          variant="outline"
          onClick={() => router.push('/history')}
          className="w-full bg-white border-2 border-blue-300 hover:bg-blue-50 text-blue-700 font-semibold py-2 text-sm"
        >
          <BookOpen className="h-4 w-4 mr-1" />
          ふりかえり
        </Button>

        <Button
          variant="outline"
          onClick={() => router.push('/upgrade')}
          className="w-full bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 hover:bg-gradient-to-r hover:from-amber-100 hover:to-yellow-100 text-amber-700 font-semibold py-2 text-sm"
        >
          <Gem className="h-4 w-4 mr-1 text-amber-500" />
          ステップアップ
        </Button>
      </div>
    </footer>
  );
}