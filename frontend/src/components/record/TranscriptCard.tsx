'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TranscriptCardProps {
  transcript: string;
}

export function TranscriptCard({ transcript }: TranscriptCardProps) {
  return (
    <Card className="w-full rounded-xl bg-blue-100/80 p-6 shadow-lg backdrop-blur-sm mb-8">
      <CardHeader className="p-0 pb-4">
        <CardTitle className="text-xl font-bold text-gray-800">話したこと</CardTitle>
      </CardHeader>
      <CardContent className="p-0 text-left">
        <div className="relative bg-white p-4 rounded-xl shadow-sm text-gray-800 text-lg leading-relaxed">
          {transcript}
        </div>
      </CardContent>
    </Card>
  );
}
