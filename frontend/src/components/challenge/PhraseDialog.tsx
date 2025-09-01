'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Volume2 } from 'lucide-react';

interface PhraseDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

// フレーズデータ
const phrases = [
  { english: 'Hello!', japanese: 'こんにちは！', color: 'text-blue-600', audio: '/audio/hello.mp3' },
  { english: 'Thank you!', japanese: 'ありがとう！', color: 'text-green-600', audio: '/audio/thank-you.mp3' },
  { english: 'Excuse me', japanese: 'すみません', color: 'text-purple-600', audio: '/audio/excuse-me.mp3' },
  { english: 'How much?', japanese: 'いくら？', color: 'text-orange-600', audio: '/audio/how-much.mp3' },
  { english: 'Where?', japanese: 'どこ？', color: 'text-pink-600', audio: '/audio/where.mp3' },
  { english: 'Help me', japanese: 'たすけて', color: 'text-red-600', audio: '/audio/help-me.mp3' },
];

export function PhraseDialog({ isOpen, onClose }: PhraseDialogProps) {
  const playAudio = (audioPath: string) => {
    const audio = new Audio(audioPath);
    audio.play().catch((error) => {
      console.error('音声再生エラー:', error);
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-yellow-50 to-orange-50">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-orange-600">
            こまったときのフレーズ
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            タップすると音声が流れます
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {phrases.map((phrase, index) => (
            <button
              key={index}
              className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
              onClick={() => playAudio(phrase.audio)}
            >
              <div className="text-left">
                <p className={`text-xl font-bold ${phrase.color}`}>{phrase.english}</p>
                <p className="text-sm text-gray-600">{phrase.japanese}</p>
              </div>
              <Volume2 className="w-6 h-6 text-gray-400" />
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}