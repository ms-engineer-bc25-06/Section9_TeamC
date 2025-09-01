'use client';

import { Card, CardContent } from '@/components/ui/card';

interface Child {
  id: string;
  nickname?: string;
  name: string;
}

interface MonthlyStatsProps {
  challengeCount: number;
  selectedChildId: string;
  children: Child[];
}

export function MonthlyStats({ challengeCount, selectedChildId, children }: MonthlyStatsProps) {
  const selectedChild = children.find((c) => c.id === selectedChildId);

  return (
    <Card className="w-full rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-sm mb-8">
      <CardContent className="p-0 text-center">
        <p className="text-lg text-gray-600 mb-2">今月のチャレンジ回数</p>
        <p className="text-5xl font-extrabold text-blue-500">{challengeCount}回</p>
        <p className="text-sm text-gray-500 mt-2">
          {selectedChildId
            ? `${selectedChild?.nickname || selectedChild?.name}よくがんばったね！`
            : 'お子さまを選択してください'}
        </p>
      </CardContent>
    </Card>
  );
}