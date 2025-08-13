'use client'; // クライアントコンポーネントとしてマーク

import { createChild } from '@/app/(app)/children/childApi';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils'; // shadcn/uiのcnユーティリティ
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ChildRegisterPage() {
  const [nickname, setNickname] = useState('');
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSubmit発火');

    if (!birthDate) {
      toast({
        variant: 'destructive',
        description: '誕生日を入力してください',
      });
      return;
    }

    try {
      setLoading(true); // ローディング開始

      await createChild({
        nickname,
        birthday: birthDate.toISOString().split('T')[0], // "YYYY-MM-DD"
      });
      toast({
        description: '子どもを登録しました', // 成功通知
      });

      router.push('/children');
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast({
          variant: 'destructive', // 赤色系
          description: error.message,
        });
      } else {
        toast({
          variant: 'destructive',
          description: '登録に失敗しました',
        });
      }
    } finally {
      setLoading(false); // ローディング終了
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-md rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-sm sm:p-8 md:p-10">
        <CardContent className="p-0">
          <h1 className="mb-6 text-center text-2xl font-bold text-gray-800 sm:text-3xl">
            なまえを教えてね
          </h1>
          <p className="mb-8 text-center text-gray-600 text-sm sm:text-base">
            たのしく遊べるように、少しだけ聞かせてね
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label
                htmlFor="nickname"
                className="text-base sm:text-lg font-medium text-gray-700 mb-2 block"
              >
                なまえ
              </Label>
              <p className="text-sm text-gray-500 mb-2">ニックネームでもOK！</p>
              <Input
                id="nickname"
                type="text"
                placeholder="例: ひなたちゃん"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 p-3 text-base focus:border-blue-400 focus:ring-blue-400"
              />
            </div>

            <div>
              <Label
                htmlFor="birthDate"
                className="text-base sm:text-lg font-medium text-gray-700 mb-2 block"
              >
                おたんじょう日🎂
              </Label>
              <p className="text-sm text-gray-500 mb-2"></p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-full justify-start text-left font-normal rounded-lg border border-gray-300 p-3 text-base',
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
                    captionLayout="dropdown" // 年と月のドロップダウンを追加
                    fromYear={new Date().getFullYear() - 15} // 過去15年まで選択可能
                    toYear={new Date().getFullYear()} // 今年まで選択可能
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? '登録中...' : '登録する'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
