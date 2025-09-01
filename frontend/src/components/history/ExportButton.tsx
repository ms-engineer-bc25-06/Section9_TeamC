'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export function ExportButton() {
  return (
    <Button
      disabled
      className="py-3 text-lg sm:py-4 sm:text-xl font-semibold rounded-full shadow-md w-full max-w-xs bg-gray-300 text-gray-500 cursor-not-allowed"
    >
      <Download className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
      記録をエクスポート（準備中）
    </Button>
  );
}