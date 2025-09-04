'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface ChallengeHeaderProps {
  childName: string;
  challengeStatus: {
    icon: React.ReactNode;
    title: string;
    color: string;
  };
}

export function ChallengeHeader({ childName, challengeStatus }: ChallengeHeaderProps) {
  return (
    <header className="w-full max-w-xl flex justify-between items-center mb-2">
      <Link
        href="/children"
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>;�</span>
      </Link>

      <div className="flex items-center gap-2">
        {challengeStatus.icon}
        <span className={`font-medium ${challengeStatus.color}`}>{challengeStatus.title}</span>
      </div>
    </header>
  );
}
