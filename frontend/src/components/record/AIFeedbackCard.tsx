'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquareHeart, ThumbsUp } from 'lucide-react';

interface AIFeedbackProps {
  praise: string;
  advice: string;
}

interface AIFeedbackCardProps {
  aiFeedback: AIFeedbackProps;
}

export function AIFeedbackCard({ aiFeedback }: AIFeedbackCardProps) {
  return (
    <Card className="w-full rounded-xl bg-green-100/80 p-6 shadow-lg backdrop-blur-sm mb-8">
      <CardHeader className="p-0 pb-4">
        <CardTitle className="text-xl font-bold text-gray-800">AIから</CardTitle>
      </CardHeader>
      <CardContent className="p-0 text-left space-y-4">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-green-700 mb-1">
            <ThumbsUp className="h-5 w-5 text-blue-500" />
            いいね
          </h3>
          <p className="text-gray-700 text-base leading-relaxed">{aiFeedback.praise}</p>
        </div>
        {aiFeedback.advice && (
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-orange-700 mb-1">
              <MessageSquareHeart className="h-5 w-5 text-pink-500" />
              アドバイス
            </h3>
            <p className="text-gray-700 text-base leading-relaxed">{aiFeedback.advice}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
