'use client';

import { createChild } from '@/app/(app)/children/childApi';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ChildRegisterPage() {
  const [nickname, setNickname] = useState('');
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('✅ handleSubmit 発火');

    if (!birthDate) {
      toast({ variant: 'destructive', description: '誕生日を入力してください' });
      return;
    }

    try {
      setLoading(true);

      if (!user) {
        toast({ variant: 'destructive', description: 'ログインが必要です' });
        return;
      }

      // Firebase IDトークン取得（必要なら getIdToken(true) で強制更新）
      const token = await user.getIdToken();
      console.log('✅ 取得したIDトークン(先頭のみ):', token?.slice(0, 20), '...');

      // API呼び出し
      const res = await createChild(
        {
          nickname: nickname,
          birth_date: birthDate.toISOString().split('T')[0],  // APIが期待するフィールド名
        },
        token
      );
      console.log('✅ API レスポンス:', res);

      toast({ description: '子どもを登録しました' });
      router.push('/children');
    } catch (err: unknown) {
      // unknown を Error に絞り込み
      const message =
        err instanceof Error ? err.message : typeof err === 'string' ? err : '登録に失敗しました';
      console.error('❌ 登録エラー:', err);
      toast({ variant: 'destructive', description: message });
    } finally {
      setLoading(false);
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
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
                    captionLayout="dropdown"
                    fromYear={new Date().getFullYear() - 15}
                    toYear={new Date().getFullYear()}
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
