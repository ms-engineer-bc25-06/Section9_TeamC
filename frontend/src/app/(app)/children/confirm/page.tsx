
'use client'; // 繧ｯ繝ｩ繧､繧｢繝ｳ繝医さ繝ｳ繝昴・繝阪Φ繝医→縺励※繝槭・繧ｯ

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react'; // 繝√ぉ繝・け繝槭・繧ｯ繧｢繧､繧ｳ繝ｳ
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation'; // useSearchParams繧偵う繝ｳ繝昴・繝・
export default function ChallengeConfirmPage() {
  const searchParams = useSearchParams();
  const childId = searchParams.get('childId'); // URL縺九ｉchildId繧貞叙蠕・
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-lg rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-sm sm:p-8 md:p-10 text-center">
        <CardContent className="p-0">
          <h1 className="mb-4 text-2xl font-bold text-gray-800 sm:text-3xl">
            繝√Ε繝ｬ繝ｳ繧ｸ縺ｮ貅門ｙ縺ｯOK・・          </h1>
          <p className="mb-8 text-center text-gray-600 text-sm sm:text-base">
            縺輔≠縲√♀蟄舌＆縺ｾ縺ｨ荳邱偵↓闍ｱ隱槭メ繝｣繝ｬ繝ｳ繧ｸ繧貞ｧ九ａ繧句燕縺ｫ縲√＞縺上▽縺狗｢ｺ隱阪＆縺帙※縺上□縺輔＞縺ｭ縲・          </p>

          <div className="mb-8 flex justify-center">
            <Image
              src="/images/challenge-confirm-illustration.png"
              alt="隕ｪ蟄舌′螟門嵜莠ｺ縺ｨ隧ｱ縺励※縺・ｋ繧ｷ繝ｳ繝励Ν縺ｪ繧､繝ｩ繧ｹ繝・
              width={250}
              height={250}
              className="object-contain rounded-lg shadow-sm"
              priority
            />
          </div>

          <div className="mb-10 space-y-4 text-left">
            <div className="flex items-start">
              <CheckCircle className="mr-3 mt-1 h-6 w-6 flex-shrink-0 text-green-500" />
              <div>
                <p className="text-base font-semibold text-gray-700 sm:text-lg">
                  螟門嵜莠ｺ縺ｮ譁ｹ縺ｫ隧ｱ縺励°縺代※繧ょ､ｧ荳亥､ｫ縺ｪ迥ｶ豕√〒縺吶°・・                </p>
                <p className="text-sm text-gray-500">
                  蜻ｨ繧翫・迺ｰ蠅・ｄ譎る俣蟶ｯ繧堤｢ｺ隱阪＠縺ｦ縲∝ｮ牙ｿ・＠縺ｦ隧ｱ縺帙ｋ蝣ｴ謇繧帝∈縺ｳ縺ｾ縺励ｇ縺・・                </p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircle className="mr-3 mt-1 h-6 w-6 flex-shrink-0 text-green-500" />
              <div>
                <p className="text-base font-semibold text-gray-700 sm:text-lg">
                  縺雁ｭ舌＆縺ｾ縺ｯ隧ｱ縺励◆縺・ｰ玲戟縺｡縺ｫ縺ｪ縺｣縺ｦ縺・∪縺吶°・・                </p>
                <p className="text-sm text-gray-500">
                  辟｡逅・ｼｷ縺・○縺壹√♀蟄舌＆縺ｾ縺ｮ縲瑚ｩｱ縺励◆縺・ｼ√阪→縺・≧豌玲戟縺｡繧貞､ｧ蛻・↓縺励∪縺励ｇ縺・・                </p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircle className="mr-3 mt-1 h-6 w-6 flex-shrink-0 text-green-500" />
              <div>
                <p className="text-base font-semibold text-gray-700 sm:text-lg">
                  骭ｲ髻ｳ縺ｮ貅門ｙ縺ｯ縺ｧ縺阪※縺・∪縺吶°・・                </p>
                <p className="text-sm text-gray-500">
                  繝√Ε繝ｬ繝ｳ繧ｸ縺ｮ險倬鹸繧呈ｮ九☆縺溘ａ縺ｫ縲√せ繝槭・繝医ヵ繧ｩ繝ｳ縺ｮ骭ｲ髻ｳ讖溯・縺ｪ縺ｩ繧呈ｺ門ｙ縺励※縺翫″縺ｾ縺励ｇ縺・・                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            {/* childId縺悟ｭ伜惠縺吶ｋ蝣ｴ蜷医・縺ｿ繝ｪ繝ｳ繧ｯ繧呈怏蜉ｹ縺ｫ縺吶ｋ */}
            <Link href={childId ? `/challenge/${childId}` : '#'} passHref>
              <Button
                className="w-full py-3 text-lg sm:py-4 sm:text-xl font-semibold rounded-full shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400 bg-green-500 text-white hover:bg-green-600"
                size="lg"
                disabled={!childId} // childId縺後↑縺・ｴ蜷医・繝懊ち繝ｳ繧堤┌蜉ｹ蛹・              >
                貅門ｙOK・∝ｧ九ａ繧・              </Button>
            </Link>
            <Link href="/children" passHref>
              <Button
                className="w-full py-3 text-lg sm:py-4 sm:text-xl font-semibold rounded-full shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400 bg-orange-400 text-white hover:bg-orange-500"
                size="lg"
                variant="outline"
              >
                繧ゅ≧蟆代＠蠕・▽
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );

}


