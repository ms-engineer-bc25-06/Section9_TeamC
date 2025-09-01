'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Volume2 } from 'lucide-react';

interface TranscriptionDisplayProps {
  transcription: string;
  isListening: boolean;
}

export function TranscriptionDisplay({ transcription, isListening }: TranscriptionDisplayProps) {
  if (!transcription && !isListening) {
    return null;
  }

  return (
    <Card className="w-full bg-white/90 backdrop-blur-sm shadow-xl">
      <CardContent className="p-6">
        <div className="flex items-start gap-3">
          <Volume2 className="w-6 h-6 text-blue-500 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              {isListening ? '^MÖŠ-...' : '‡WwSWPœ'}
            </h3>
            <div className="min-h-[100px] p-4 bg-gray-50 rounded-lg">
              {transcription ? (
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {transcription}
                </p>
              ) : (
                <p className="text-gray-400 italic">
                  qWKQfO`UD...
                </p>
              )}
            </div>
          </div>
        </div>
        
        {isListening && (
          <div className="mt-4 flex items-center justify-center">
            <div className="flex items-center gap-2 text-red-500">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium">2ó-</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}