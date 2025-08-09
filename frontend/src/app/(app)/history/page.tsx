
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, isSameMonth, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// ------------------------------
// 繝繝溘・繝・・繧ｿ・・PI蟆主・蠕後・蜑企勁莠亥ｮ夲ｼ・// ------------------------------
const childrenData = [
  { id: '1', name: '縺ｲ縺ｪ縺・ },
  { id: '2', name: '縺輔￥繧・ },
];

const dummyChallengeRecords = [
  {
    id: 'rec_001',
    childId: '1',
    date: '2025-08-02T10:00:00Z',
    summary: '蛻昴ａ縺ｦ縺ｮ閾ｪ蟾ｱ邏ｹ莉九メ繝｣繝ｬ繝ｳ繧ｸ・・,
  },
  {
    id: 'rec_002',
    childId: '2',
    date: '2025-08-03T14:30:00Z',
    summary: '螂ｽ縺阪↑蜍慕黄繧定恭隱槭〒險縺医◆縺ｭ・・,
  },

  {
    id: 'rec_003',
    childId: '1',
    date: '2025-08-03T11:00:00Z',
    summary: '闍ｱ隱槭〒險縺医◆繧茨ｼ・,
  },
];

export default function ChallengeHistoryPage() {
  const [selectedChildId, setSelectedChildId] = useState<string>(childrenData[0]?.id || '');
  const [records, setRecords] = useState<typeof dummyChallengeRecords>([]);
  const [thisMonthChallengeCount, setThisMonthChallengeCount] = useState(0);

  useEffect(() => {
    if (!selectedChildId) {
      setRecords([]);
      setThisMonthChallengeCount(0);
      return;
    }

    // -------------------------------------------------
    // TODO: API蟆主・譎ゅ・縺薙・驛ｨ蛻・ｒAPI繝ｪ繧ｯ繧ｨ繧ｹ繝医↓鄂ｮ縺肴鋤縺医ｋ
    // 萓・ fetch(`/api/challenge-records?childId=${selectedChildId}`)
    // -------------------------------------------------
    const data = dummyChallengeRecords;

    const recordsForChild = data
      .filter((record) => record.childId === selectedChildId)
      .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

    setRecords(recordsForChild);

    // 莉頑怦縺ｮ繝√Ε繝ｬ繝ｳ繧ｸ蝗樊焚繧定ｨ育ｮ・    const currentMonth = new Date();
    const count = recordsForChild.filter((record) =>
      isSameMonth(parseISO(record.date), currentMonth)
    ).length;
    setThisMonthChallengeCount(count);
  }, [selectedChildId]);

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 sm:p-6 lg:p-8">
      {/* 繝倥ャ繝繝ｼ */}
      <header className="relative w-full max-w-4xl flex justify-between items-center mb-8">
        <Link
          href="/children"
          className="text-gray-600 hover:text-gray-800 transition-colors flex items-center"
        >
          <ArrowLeft className="h-6 w-6 mr-1" />
          <span className="text-lg font-medium">謌ｻ繧・/span>
        </Link>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-xl font-bold text-gray-800 sm:text-2xl">
          縺ｵ繧翫°縺医ｊ
        </h1>
        <div className="w-24"></div>
      </header>

      <main className="w-full max-w-4xl flex-1 flex flex-col items-center py-8">
        {/* 蟄舌←繧る∈謚槭・繝ｫ繝繧ｦ繝ｳ */}
        <div className="mb-8 w-full max-w-xs">
          <Select onValueChange={setSelectedChildId} defaultValue={selectedChildId}>
            <SelectTrigger className="w-full rounded-full bg-white/80 shadow-md text-lg font-semibold text-gray-700">
              <SelectValue placeholder="縺雁ｭ舌＆縺ｾ繧帝∈謚・ />
            </SelectTrigger>
            <SelectContent className="rounded-xl bg-white/90 shadow-lg">
              {childrenData.map((child) => (
                <SelectItem key={child.id} value={child.id} className="text-lg">
                  {child.name}縺｡繧・ｓ
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 邨ｱ險域ュ蝣ｱ */}
        <Card className="w-full rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-sm mb-8">
          <CardContent className="p-0 text-center">
            <p className="text-lg text-gray-600 mb-2">莉頑怦縺ｮ繝√Ε繝ｬ繝ｳ繧ｸ蝗樊焚</p>
            <p className="text-5xl font-extrabold text-blue-500">{thisMonthChallengeCount}蝗・/p>
            <p className="text-sm text-gray-500 mt-2">
              {selectedChildId
                ? `${childrenData.find((c) => c.id === selectedChildId)?.name}縺｡繧・ｓ縲√ｈ縺上′繧薙・縺｣縺溘・・～
                : '縺雁ｭ舌＆縺ｾ繧帝∈謚槭＠縺ｦ縺上□縺輔＞'}
            </p>
          </CardContent>
        </Card>

        {/* 險倬鹸繝ｪ繧ｹ繝・*/}
        <div className="w-full space-y-4 mb-8">
          {records.length > 0 ? (
            records.map((record) => (
              <Card
                key={record.id}
                className="w-full rounded-xl bg-white/80 p-4 shadow-md backdrop-blur-sm flex items-center justify-between"
              >
                <CardContent className="p-0 flex items-center">
                  <CalendarDays className="h-8 w-8 text-purple-400 mr-4 flex-shrink-0" />
                  <div>
                    <p className="text-lg font-semibold text-gray-700">
                      {format(parseISO(record.date), 'yyyy蟷ｴMM譛・d譌･ (EEE)', { locale: ja })}
                    </p>
                    <p className="text-sm text-gray-500">{record.summary}</p>
                  </div>
                </CardContent>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full text-blue-500 border-blue-300 hover:bg-blue-50"
                >
                  <Link href={`/history/${record.childId}/${record.id}`}>隧ｳ邏ｰ</Link>
                </Button>
              </Card>
            ))
          ) : (
            <Card className="w-full rounded-xl bg-white/80 p-6 shadow-md backdrop-blur-sm text-center">
              <CardContent className="p-0 text-gray-600 text-lg">險倬鹸縺後≠繧翫∪縺帙ｓ縲・/CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}


