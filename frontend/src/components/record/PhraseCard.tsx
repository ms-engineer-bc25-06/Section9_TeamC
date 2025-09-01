'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PhraseData {
  en: string;
  ja: string;
}

interface PhraseCardProps {
  phraseData: PhraseData;
}

export function PhraseCard({ phraseData }: PhraseCardProps) {
  return (
    <Card className="w-full rounded-xl bg-blue-50/80 p-6 shadow-lg backdrop-blur-sm mb-8">
      <CardHeader className="p-0 pb-4">
        <CardTitle className="text-lg font-bold text-blue-800">
          💡 こんな言い方もあるよ！
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="bg-white/60 rounded-lg p-4">
          <p className="text-xl font-semibold text-blue-700 mb-2">{phraseData.en}</p>
          <p className="text-gray-600">{phraseData.ja}</p>
        </div>
      </CardContent>
    </Card>
  );
}