'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { Child } from '@/types';
import { format, parseISO } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function ChildEditPage() {
  const [nickname, setNickname] = useState('');
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [child, setChild] = useState<Child | null>(null);
  const router = useRouter();
  const params = useParams();
  const childId = params.childId as string;

  useEffect(() => {
    const fetchChild = async () => {
      if (!childId) return;
      
      try {
        setIsFetching(true);
        const childData = await api.children.get(childId);
        setChild(childData);
        setNickname(childData.nickname || childData.name || '');
        if (childData.birthdate) {
          setBirthDate(parseISO(childData.birthdate));
        }
      } catch (error) {
        console.error('子ども情報取得エラー:', error);
        setError('子ども情報の取得に失敗しました');
      } finally {
        setIsFetching(false);
      }
    };

    fetchChild();
  }, [childId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await api.children.update(childId, {
        name: nickname,
        nickname: nickname,
        birthdate: birthDate?.toISOString().split('T')[0], // YYYY-MM-DD形式
      });

      // 更新後、子ども選択画面にリダイレクト
      router.push('/children');
    } catch (error) {
      console.error('子ども更新エラー:', error);
      setError(error instanceof Error ? error.message : '更新に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('本当にこの子どもの情報を削除しますか？')) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await api.children.delete(childId);
      router.push('/children');
    } catch (error) {
      console.error('子ども削除エラー:', error);
      setError(error instanceof Error ? error.message : '削除に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 sm:p-6 lg:p-8">
        <div>🔄 読み込み中...</div>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 sm:p-6 lg:p-8">
        <Card className="w-full max-w-md rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-sm">
          <CardContent className="p-0">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">子ども情報が見つかりません</h1>
            <Button onClick={() => router.push('/children')} className="w-full">
              ホームに戻る
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-md rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-sm sm:p-8 md:p-10">
        <CardContent className="p-0">
          <h1 className="mb-6 text-center text-2xl font-bold text-gray-800 sm:text-3xl">
            なまえを変更する
          </h1>
          <p className="mb-8 text-center text-gray-600 text-sm sm:text-base">
            {child.nickname || child.name}ちゃんの情報を変更できます
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

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
                    captionLayout="dropdown"
                    fromYear={new Date().getFullYear() - 15}
                    toYear={new Date().getFullYear()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex space-x-4">
              <Button
                type="submit"
                disabled={isLoading || !nickname.trim()}
                className="flex-1 py-3 text-lg font-semibold rounded-full shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? '更新中...' : '更新する'}
              </Button>
              
              <Button
                type="button"
                onClick={handleDelete}
                disabled={isLoading}
                className="flex-1 py-3 text-lg font-semibold rounded-full shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400 bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? '削除中...' : '削除する'}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <Button
              onClick={() => router.push('/children')}
              variant="outline"
              className="w-full"
            >
              キャンセル
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}