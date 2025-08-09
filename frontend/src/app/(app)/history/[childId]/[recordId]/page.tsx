
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// 繝繝溘・縺ｮ繝√Ε繝ｬ繝ｳ繧ｸ險倬鹸隧ｳ邏ｰ繝・・繧ｿ
const dummyRecordDetails = [
  {
    id: 'rec_001',
    childId: '1',
    title: '閾ｪ蟾ｱ邏ｹ莉九メ繝｣繝ｬ繝ｳ繧ｸ',
    timestamp: new Date('2025-08-02T10:00:00Z'),
    transcript: 'Hello, my name is Hinata. I am six years old. Nice to meet you!',
    aiFeedback: {
      praise:
        '縺ｲ縺ｪ縺溘■繧・ｓ縲√→縺ｦ繧ゅ・縺｣縺阪ｊ縺ｨ閾ｪ蟾ｱ邏ｹ莉九′縺ｧ縺阪∪縺励◆縺ｭ・∫音縺ｫ"Hello"縺ｨ"Nice to meet you"縺ｮ逋ｺ髻ｳ縺檎ｴ譎ｴ繧峨＠縺・〒縺吶り・菫｡繧呈戟縺｣縺ｦ隧ｱ縺帙※縺・∪縺励◆縺ｭ・・,
      advice:
        '繧ゅ≧蟆代＠繧・▲縺上ｊ隧ｱ縺吶→縲√ｂ縺｣縺ｨ逶ｸ謇九↓莨昴ｏ繧翫ｄ縺吶￥縺ｪ繧翫∪縺吶ｈ縲よｬ｡縺ｯ縲∝･ｽ縺阪↑繧ゅ・繧定恭隱槭〒邏ｹ莉九＠縺ｦ縺ｿ繧医≧・・,
    },
  },
  {
    id: 'rec_002',
    childId: '2',
    title: '螂ｽ縺阪↑蜍慕黄繝√Ε繝ｬ繝ｳ繧ｸ',
    timestamp: new Date('2025-08-03T14:30:00Z'),
    transcript: 'I like cats. Cats are cute. Meow!',
    aiFeedback: {
      praise:
        '縺輔￥繧峨■繧・ｓ縲・cats"縺ｮ逋ｺ髻ｳ縺後→縺ｦ繧ゆｸ頑焔縺ｧ縺励◆・∵闘髻ｳ隱槭・"Meow!"繧ょ庄諢帙ｉ縺励￥縺ｦ縲∬｡ｨ迴ｾ蜉帙′雎翫°縺ｧ縺吶・縲・,
      advice:
        '譁・ｫ縺ｮ縺､縺ｪ縺守岼繧呈э隴倥☆繧九→縲√ｈ繧願・辟ｶ縺ｪ莨夊ｩｱ縺ｫ縺ｪ繧翫∪縺吶ゆｾ九∴縺ｰ縲・I like cats. They are cute."縺ｮ繧医≧縺ｫ險縺｣縺ｦ縺ｿ縺ｾ縺励ｇ縺・・,
    },
  },
  {
    id: 'rec_003',
    childId: '1',
    title: '莉頑律縺ｮ繝√Ε繝ｬ繝ｳ繧ｸ',
    timestamp: new Date('2025-08-03T10:30:00Z'),
    transcript: 'Hello, how are you? I am fine, thank you. And you?',
    aiFeedback: {
      praise:
        '縺ｲ縺ｪ縺溘■繧・ｓ縲∝渕譛ｬ逧・↑謖ｨ諡ｶ縺後→縺ｦ繧ゅせ繝繝ｼ繧ｺ縺ｫ縺ｧ縺阪∪縺励◆縺ｭ・∫嶌謇九ｒ豌鈴▲縺・ｳｪ蝠上ｂ縺ｧ縺阪※縺・※邏譎ｴ繧峨＠縺・〒縺吶・,
      advice: '谺｡縺ｯ縲∬・蛻・・豌玲戟縺｡繧偵ｂ縺・ｰ代＠隧ｳ縺励￥陦ｨ迴ｾ縺吶ｋ險闡峨ｒ隕壹∴縺ｦ縺ｿ縺ｾ縺励ｇ縺・・,
    },
  },
];

export default function ChallengeDetailPage() {
  const params = useParams();
  const childId = params.childId as string;
  const recordId = params.recordId as string;

  const record = dummyRecordDetails.find((rec) => rec.id === recordId && rec.childId === childId);

  if (!record) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 sm:p-6 lg:p-8 text-center">
        <Card className="w-full max-w-md rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-sm">
          <CardContent className="p-0">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">險倬鹸縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ</h1>
            <p className="text-gray-600 mb-6">
              謖・ｮ壹＆繧後◆繝√Ε繝ｬ繝ｳ繧ｸ險倬鹸縺ｮ繝・・繧ｿ縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ縺ｧ縺励◆縲・            </p>
            <Link href="/children" passHref>
              <Button className="w-full py-3 text-lg font-semibold rounded-full bg-blue-400 text-white hover:bg-blue-500">
                繝帙・繝縺ｫ謌ｻ繧・              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 sm:p-6 lg:p-8">
      {/* 繝倥ャ繝繝ｼ */}
      <header className="relative w-full max-w-4xl flex justify-between items-center mb-8">
        <Link
          href="/history"
          className="text-gray-600 hover:text-gray-800 transition-colors flex items-center"
        >
          <ArrowLeft className="h-6 w-6 mr-1" />
          <span className="text-lg font-medium">繧ゅ←繧・/span>
        </Link>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-xl font-bold text-gray-800 sm:text-2xl text-center">
          {format(record.timestamp, 'yyyy蟷ｴMM譛・d譌･ (EEE)', { locale: ja })}
          <br />
        </h1>
        {/* 蜿ｳ蛛ｴ縺ｫ繧ｹ繝壹・繧ｹ繧堤｢ｺ菫昴☆繧九◆繧√□縺代・隕∫ｴ */}
        <div className="w-24"></div>
      </header>

      <main className="w-full max-w-2xl flex-1 flex flex-col items-center py-8">
        {/* 譁・ｭ苓ｵｷ縺薙＠繝・く繧ｹ繝・*/}
        <Card className="w-full rounded-xl bg-blue-100/80 p-6 shadow-lg backdrop-blur-sm mb-8">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-xl font-bold text-gray-800">隧ｱ縺励◆縺薙→</CardTitle>
          </CardHeader>
          <CardContent className="p-0 text-left">
            <div className="relative bg-white p-4 rounded-xl shadow-sm text-gray-800 text-lg leading-relaxed">
              {record.transcript}
            </div>
          </CardContent>
        </Card>

        {/* AI繝輔ぅ繝ｼ繝峨ヰ繝・け */}
        <Card className="w-full rounded-xl bg-green-100/80 p-6 shadow-lg backdrop-blur-sm mb-8">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-xl font-bold text-gray-800">AI縺九ｉ</CardTitle>
          </CardHeader>
          <CardContent className="p-0 text-left space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-green-700 mb-1">笨ｨ 縺・＞縺ｭ</h3>
              <p className="text-gray-700 text-base leading-relaxed">{record.aiFeedback.praise}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-orange-700 mb-1">庁 繧｢繝峨ヰ繧､繧ｹ</h3>
              <p className="text-gray-700 text-base leading-relaxed">{record.aiFeedback.advice}</p>
            </div>
          </CardContent>
        </Card>

        <Link href="/children" passHref>
          <Button className="w-full max-w-xs py-3 text-lg sm:py-4 sm:text-xl font-semibold rounded-full shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 bg-blue-400 text-white hover:bg-blue-500">
            繝帙・繝
          </Button>
        </Link>
      </main>
    </div>
  );
}


