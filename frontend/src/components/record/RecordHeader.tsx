'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface RecordHeaderProps {
  timestamp: Date;
}

export function RecordHeader({ timestamp }: RecordHeaderProps) {
  return (
    <header className="w-full max-w-4xl grid grid-cols-3 items-center mb-8">
      <Link
        href="/history"
        className="text-gray-600 hover:text-gray-800 transition-colors flex items-center"
      >
        <ArrowLeft className="h-6 w-6 mr-1" />
        <span className="text-lg font-medium">もどる</span>
      </Link>
      <h1 className="text-xl font-bold text-gray-800 sm:text-2xl text-center col-span-1">
        <span className="whitespace-nowrap">
          {format(timestamp, 'yyyy年MM月dd日 (EEE)', { locale: ja })}
        </span>
      </h1>
      <div className="col-span-1"></div>
    </header>
  );
}
