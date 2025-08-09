'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale'; // 譌･譛ｬ隱槭Ο繧ｱ繝ｼ繝ｫ繧偵う繝ｳ繝昴・繝・import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

// TODO: 蟆・擂逧・↓縺ｯAPI縺九ｉ蜿門ｾ励☆繧九ム繝溘・繝・・繧ｿ縺ｯ蛻･繝輔ぃ繧､繝ｫ縺ｫ蛻・牡縺励※繧り憶縺・const dummyRecords = [
  {
    id: 'rec_1700000000000', // 萓・ rec_Date.now()
    childId: '1',
    childName: '縺ｲ縺ｪ縺・,
    timestamp: new Date('2025-08-07T10:30:00Z'),
    aiFeedback:
      '縺ｲ縺ｪ縺溘■繧・ｓ縲∫ｴ譎ｴ繧峨＠縺・匱髻ｳ縺ｧ縺励◆・∫音縺ｫ"apple"縺ｮ逋ｺ髻ｳ縺後→縺ｦ繧ゅけ繝ｪ繧｢縺ｧ縲∬・菫｡繧呈戟縺｣縺ｦ隧ｱ縺帙※縺・∪縺励◆縺ｭ縲ゅ％繧後°繧峨ｂ濶ｲ縲・↑蜊倩ｪ槭↓謖第姶縺励※縺ｿ繧医≧・・,
  },
  {
    id: 'rec_1700000000001',
    childId: '2',
    childName: '縺輔￥繧・,
    timestamp: new Date('2025-08-07T11:15:00Z'),
    aiFeedback:
      '縺輔￥繧峨■繧・ｓ縲∽ｻ頑律縺ｯ遨肴･ｵ逧・↓隧ｱ縺昴≧縺ｨ縺吶ｋ蟋ｿ蜍｢縺後→縺ｦ繧り憶縺九▲縺溘〒縺呻ｼ∝ｰ代＠隧ｰ縺ｾ縺｣縺ｦ繧ゅ∵怙蠕後∪縺ｧ莨昴∴繧医≧縺ｨ縺吶ｋ豌玲戟縺｡縺悟､ｧ蛻・□繧医よｬ｡縺ｯ繧ゅ▲縺ｨ髟ｷ縺・枚遶縺ｫ謖第姶縺励※縺ｿ繧医≧縺ｭ・・,
  },
];

export default function RecordCompletionPage() {
  const params = useParams();
  const recordId = params.recordId as string;

  const [record, setRecord] = useState<(typeof dummyRecords)[0] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: API騾｣謳ｺ譎ゅ・fetch繧・xios縺ｧ髱槫酔譛溷叙蠕励☆繧区Φ螳・    setLoading(true);

    // 繝繝溘・繝・・繧ｿ縺九ｉ隧ｲ蠖途ecord繧呈爾縺呻ｼ亥酔譛溷・逅・ｼ・    const foundRecord = dummyRecords.find((rec) => rec.id === recordId) ?? null;

    // 譛ｬ譚･縺ｯ髱槫酔譛滄壻ｿ｡縺ｮ螳御ｺ・ｒ蠕・▽縺ｮ縺ｧsetTimeout縺ｧ謫ｬ莨ｼ驕・ｻｶ繧貞・繧後※繧り憶縺・    setRecord(foundRecord);
    setLoading(false);
  }, [recordId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 sm:p-6 lg:p-8 text-center">
        <p className="text-gray-600 text-lg">隱ｭ縺ｿ霎ｼ縺ｿ荳ｭ...</p>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 sm:p-6 lg:p-8 text-center">
        <Card className="w-full max-w-md rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-sm">
          <CardContent className="p-0">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">險倬鹸縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ</h1>
            <p className="text-gray-600 mb-6">謖・ｮ壹＆繧後◆險倬鹸ID縺ｮ繝・・繧ｿ縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ縺ｧ縺励◆縲・/p>
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 sm:p-6 lg:p-8 text-center">
      <main className="w-full max-w-2xl flex-1 flex flex-col items-center justify-center py-8">
        <h1 className="mb-8 text-4xl font-extrabold text-pink-600 sm:text-5xl md:text-6xl drop-shadow-lg">
          繧医￥縺後ｓ縺ｰ縺｣縺溘・・・        </h1>

        <Card className="w-full rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-sm mb-8">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-xl font-bold text-gray-800 sm:text-2xl">
              {record.childName}縺｡繧・ｓ縺ｸ縺ｮ繝｡繝・そ繝ｼ繧ｸ
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 text-left">
            <p className="text-gray-700 text-base sm:text-lg leading-relaxed">
              {record.aiFeedback}
            </p>
            <div className="mt-6 text-sm text-gray-500">
              <p>險倬鹸譌･譎・ {format(record.timestamp, 'yyyy蟷ｴMM譛・d譌･ HH:mm', { locale: ja })}</p>
            </div>
          </CardContent>
        </Card>

        <Link href="/children" passHref>
          <Button className="w-full max-w-xs py-3 text-lg sm:py-4 sm:text-xl font-semibold rounded-full shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 bg-blue-400 text-white hover:bg-blue-500">
            繝帙・繝縺ｫ謌ｻ繧・          </Button>
        </Link>
      </main>
    </div>
  );
}


