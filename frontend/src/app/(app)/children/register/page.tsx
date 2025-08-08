'use client'; // 繧ｯ繝ｩ繧､繧｢繝ｳ繝医さ繝ｳ繝昴・繝阪Φ繝医→縺励※繝槭・繧ｯ

import { Button } from '@/components/ui/Button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils'; // shadcn/uiのcnユーティリティ
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';


export default function ChildRegisterPage() {
  const [nickname, setNickname] = useState('');
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 縺薙％縺ｧ蟄舌←繧ゅ・諠・ｱ繧偵ョ繝ｼ繧ｿ繝吶・繧ｹ縺ｫ逋ｻ骭ｲ縺吶ｋ繝ｭ繧ｸ繝・け繧貞ｮ溯｣・
    console.log('逋ｻ骭ｲ諠・ｱ:', { nickname, birthDate: birthDate?.toISOString() });

    // 逋ｻ骭ｲ蠕後√Θ繝ｼ繧ｶ繝ｼ驕ｸ謚樒判髱｢縺ｫ繝ｪ繝繧､繝ｬ繧ｯ繝・
    router.push('/children');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-md rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-sm sm:p-8 md:p-10">
        <CardContent className="p-0">
          <h1 className="mb-6 text-center text-2xl font-bold text-gray-800 sm:text-3xl">
            縺雁ｭ舌＆縺ｾ縺ｮ諠・ｱ繧呈蕗縺医※縺上□縺輔＞
          </h1>
          <p className="mb-8 text-center text-gray-600 text-sm sm:text-base">
            縺雁ｭ舌＆縺ｾ縺梧･ｽ縺励￥繧｢繝励Μ繧剃ｽｿ縺医ｋ繧医≧縺ｫ縲√＞縺上▽縺玖ｳｪ蝠上＆縺帙※縺上□縺輔＞縺ｭ縲・
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>

                
              <Label
                htmlFor="nickname"
                className="text-base sm:text-lg font-medium text-gray-700 mb-2 block"
              >
                呼び名

              </Label>
              <p className="text-sm text-gray-500 mb-2">
                繧｢繝励Μ蜀・〒陦ｨ遉ｺ縺輔ｌ繧九♀蟄舌＆縺ｾ縺ｮ蜻ｼ縺ｳ蜷阪〒縺吶ゅ・繧峨′縺ｪ繧・き繧ｿ繧ｫ繝翫〒繧ょ､ｧ荳亥､ｫ縺ｧ縺吶ｈ縲・
              </p>
              <Input
                id="nickname"
                type="text"
                placeholder="萓・ 縺ｲ縺ｪ縺溘■繧・ｓ"
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
                生年月日

              </Label>
              <p className="text-sm text-gray-500 mb-2">
                縺雁ｭ舌＆縺ｾ縺ｮ蟷ｴ鮨｢縺ｫ蜷医ｏ縺帙※縲√♀縺吶☆繧√・繝√Ε繝ｬ繝ｳ繧ｸ繧呈署譯医＠縺ｾ縺吶・
              </p>
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

            <Button
              type="submit"
              className="w-full py-3 text-lg sm:py-4 sm:text-xl font-semibold rounded-full shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400 bg-green-500 text-white hover:bg-green-600 mt-8"
            >
              逋ｻ骭ｲ縺吶ｋ
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}




