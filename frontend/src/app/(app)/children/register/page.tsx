'use client';

import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export default function ChildRegisterPage() {
  const [nickname, setNickname] = useState('');
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: API連携で保存（今はログのみ）
    console.log('送信:', { nickname, birthDate: birthDate?.toISOString() });
    router.push('/children');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-md rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-sm sm:p-8 md:p-10">
        <CardContent className="p-0">
          <h1 className="mb-6 text-center text-2xl font-bold text-gray-800 sm:text-3xl">
            お子さまの登録
          </h1>
          <p className="mb-8 text-center text-gray-600 text-sm sm:text-base">
            ニックネームと生年月日を入力してください。後から変更できます。
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ニックネーム */}
            <div>
              <Label
                htmlFor="nickname"
                className="mb-2 block text-base font-medium text-gray-700 sm:text-lg"
              >
                ニックネーム
              </Label>
              <p className="mb-2 text-sm text-gray-500">例：ひなた／さくら など</p>
              <Input
                id="nickname"
                type="text"
                placeholder="例：ひなた"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 p-3 text-base focus:border-blue-400 focus:ring-blue-400"
              />
            </div>

            {/* 生年月日 */}
            <div>
              <Label
                htmlFor="birthDate"
                className="mb-2 block text-base font-medium text-gray-700 sm:text-lg"
              >
                生年月日
              </Label>
              <p className="mb-2 text-sm text-gray-500">正確な年齢に基づいた問題が出題されます。</p>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      'w-full justify-start rounded-lg border border-gray-300 p-3 text-left font-normal text-base',
                      !birthDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-5 w-5" />
                    {birthDate ? format(birthDate, 'yyyy年MM月dd日') : <span>生年月日を選択</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={birthDate}
                    onSelect={setBirthDate}
                    initialFocus
                    captionLayout="dropdown"
                    fromYear={new Date().getFullYear() - 15}
                    toYear={new Date().getFullYear()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* 送信 */}
            <Button
              type="submit"
              className="mt-8 w-full rounded-full bg-green-500 py-3 text-lg font-semibold text-white shadow-md transition-transform hover:scale-105 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 sm:py-4 sm:text-xl"
            >
              登録する
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


