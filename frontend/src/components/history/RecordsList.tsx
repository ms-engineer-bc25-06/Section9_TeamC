'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { CalendarDays, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface ChallengeRecord {
  id: string;
  childId: string;
  date: string;
  summary: string;
}

interface RecordsListProps {
  records: ChallengeRecord[];
  loading: boolean;
  deletingId: string | null;
  onDelete: (recordId: string) => void;
}

export function RecordsList({ records, loading, deletingId, onDelete }: RecordsListProps) {
  if (loading) {
    return (
      <Card className="w-full rounded-xl bg-white/80 p-6 shadow-md backdrop-blur-sm text-center">
        <CardContent className="p-0">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600">読み込み中...</p>
        </CardContent>
      </Card>
    );
  }

  if (records.length === 0) {
    return (
      <Card className="w-full rounded-xl bg-white/80 p-6 shadow-md backdrop-blur-sm text-center">
        <CardContent className="p-0 text-gray-600 text-lg">まだ記録がありません。</CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-4 mb-8">
      {records.map((record) => (
        <Card
          key={record.id}
          className="w-full rounded-xl bg-white/80 p-4 shadow-md backdrop-blur-sm"
        >
          <CardContent className="p-0 flex items-center justify-between">
            <div className="flex items-center">
              <CalendarDays className="h-8 w-8 text-purple-400 mr-4 flex-shrink-0" />
              <div>
                <p className="text-lg font-semibold text-gray-700">
                  {format(parseISO(record.date), 'yyyy年MM月dd日 (EEE)', { locale: ja })}
                </p>
                <p className="text-sm text-gray-500">{record.summary}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="rounded-full text-blue-500 border-blue-300 hover:bg-blue-50"
              >
                <Link href={`/history/${record.childId}/${record.id}`}>詳細</Link>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(record.id)}
                disabled={deletingId === record.id}
                className="rounded-full text-red-500 hover:text-red-700 hover:bg-red-50 p-2"
                title="記録を削除"
              >
                <Trash2 size={16} />
                {deletingId === record.id && <span className="ml-1 text-xs">削除中...</span>}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
