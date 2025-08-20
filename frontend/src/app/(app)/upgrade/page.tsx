'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, BookOpen, CheckCircle, CreditCard, FileText, Target } from 'lucide-react';
import Link from 'next/link';

export default function UpgradePage() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 sm:p-6 lg:p-8">
      <header className="relative w-full max-w-xl flex justify-between items-center mb-6 px-4 sm:px-6">
        <Link
          href="/children"
          className="text-gray-600 hover:text-gray-800 transition-colors flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span className="text-xs font-medium">もどる</span>
        </Link>
        <div className="w-16" /> {/* 右のスペース確保 */}
      </header>

      <main className="w-full max-w-xl flex-1 flex flex-col items-center py-6 px-4 sm:px-6">
        <h2 className="mb-6 text-2xl font-bold text-gray-800 sm:text-3xl text-center leading-tight">
          プレミアムプランで、
          <br className="block sm:hidden" />
          もっと楽しく英語体験！
        </h2>
        <p className="mb-8 text-center text-gray-600 text-base sm:text-lg">
          お子さまの英語学習をさらにサポートする、特別な機能をご用意しました。
        </p>

        {/* 以下省略せず元のコード通り続きます */}
        {/* プラン特典セクション */}
        <Card className="w-full rounded-xl bg-white/80 p-4 sm:p-6 shadow-lg backdrop-blur-sm mb-8">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="text-lg font-bold text-gray-800">プレミアム特典</CardTitle>
          </CardHeader>
          <CardContent className="p-0 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* 各特典 */}
            <div className="flex items-start">
              <FileText className="h-6 w-6 text-blue-500 mr-2 flex-shrink-0" />
              <div>
                <h3 className="text-base font-semibold text-gray-700">詳細な学習レポート</h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  学習進捗や得意・苦手が一目で分かります。
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <Target className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" />
              <div>
                <h3 className="text-base font-semibold text-gray-700">
                  カスタマイズされた練習プラン
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  AIがぴったりのチャレンジを提案します。
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <BookOpen className="h-6 w-6 text-yellow-500 mr-2 flex-shrink-0" />
              <div>
                <h3 className="text-base font-semibold text-gray-700">ママ向け英語フレーズ集</h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  日常で使える便利なフレーズを確認できます。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 無料版との比較表 */}
        <Card className="w-full rounded-xl bg-white/80 p-4 sm:p-6 shadow-lg backdrop-blur-sm mb-8 overflow-auto">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="text-lg font-bold text-gray-800">無料版との比較</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full min-w-[300px] text-left border-collapse text-sm sm:text-base">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 rounded-tl-lg">機能</th>
                  <th className="p-2 rounded-tl-lg min-w-[60px] whitespace-nowrap">無料版</th>
                  <th className="p-2 rounded-tr-lg min-w-[60px] whitespace-nowrap">プレミアム</th>
                </tr>
              </thead>
              <tbody>
                {[
                  '基本チャレンジ',
                  'AIフィードバック',
                  '詳細な学習レポート',
                  '練習プラン',
                  'ママ向けフレーズ集',
                ].map((feature, i) => (
                  <tr key={feature} className={i === 4 ? 'rounded-bl-lg rounded-br-lg' : ''}>
                    <td className="p-2 border-t border-gray-200">{feature}</td>
                    <td className="p-2 border-t border-gray-200">
                      {i < 2 ? <CheckCircle className="h-4 w-4 text-green-500 inline" /> : '-'}
                    </td>
                    <td className="p-2 border-t border-gray-200">
                      <CheckCircle className="h-4 w-4 text-green-500 inline" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* 料金と決済フォーム */}
        <Card className="w-full rounded-xl bg-white/80 p-4 sm:p-6 shadow-lg backdrop-blur-sm mb-8 text-center">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="text-lg font-bold text-gray-800">料金プラン</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-4xl sm:text-5xl font-extrabold text-pink-600 mb-3">月額980円</p>
            <p className="text-base sm:text-lg text-gray-700 mb-5">
              （初月無料！いつでも解約できます）
            </p>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center justify-center">
                <CreditCard className="h-5 w-5 mr-2 text-gray-600" />
                クレジットカード情報
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-3">
                Stripeによる安全な決済システム
              </p>
              <div className="border border-dashed border-gray-300 p-6 rounded-lg text-gray-500 text-center text-xs sm:text-sm">
                <p>Stripeクレジットカード入力フォームのプレースホルダー</p>
                <p className="mt-1">（実際の決済機能はバックエンド連携が必要です）</p>
              </div>
              <Button className="w-full py-3 text-base sm:text-lg font-semibold rounded-full shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400 bg-green-500 text-white hover:bg-green-600 mt-4">
                プレミアムプランに登録する
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* FAQセクション */}
        <Card className="w-full rounded-xl bg-white/80 p-4 sm:p-6 shadow-lg backdrop-blur-sm mb-8">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="text-lg font-bold text-gray-800">よくある質問</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-left text-sm sm:text-base font-semibold text-gray-700 hover:no-underline">
                  初月無料とはどういうことですか？
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 text-xs sm:text-sm">
                  ご登録いただいた月の月額料金は無料となります。翌月1日から月額料金が発生します。
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-left text-sm sm:text-base font-semibold text-gray-700 hover:no-underline">
                  いつでも解約できますか？
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 text-xs sm:text-sm">
                  はい、いつでもオンラインで簡単に解約手続きが可能です。違約金などは一切かかりません。
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* 安心の解約保証 */}
        <Card className="w-full max-w-xl rounded-xl bg-yellow-50/80 p-4 sm:p-6 shadow-lg backdrop-blur-sm text-center mx-auto">
          <CardContent className="p-0">
            <h3 className="text-lg font-bold text-orange-600 mb-2">安心の解約保証</h3>
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
              お客様に安心してご利用いただくため、
              <br />
              いつでも簡単に解約できる保証付きです。
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
