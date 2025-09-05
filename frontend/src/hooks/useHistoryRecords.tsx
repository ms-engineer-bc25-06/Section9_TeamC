'use client';

import { api } from '@/lib/api';
import { isSameMonth, parseISO } from 'date-fns';
import { useEffect, useState } from 'react';

interface ChallengeRecord {
  id: string;
  childId: string;
  date: string;
  summary: string;
}

export function useHistoryRecords(selectedChildId: string) {
  const [records, setRecords] = useState<ChallengeRecord[]>([]);
  const [thisMonthChallengeCount, setThisMonthChallengeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (recordId: string) => {
    if (!confirm('この記録を削除しますか？削除した記録は元に戻せません。')) {
      return;
    }

    setDeletingId(recordId);

    try {
      await api.challenges.delete(recordId);

      setRecords((prev) => prev.filter((record) => record.id !== recordId));

      const currentMonth = new Date();
      const remainingRecords = records.filter((record) => record.id !== recordId);
      const count = remainingRecords.filter((record) =>
        isSameMonth(parseISO(record.date), currentMonth)
      ).length;
      setThisMonthChallengeCount(count);
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除中にエラーが発生しました');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    if (!selectedChildId) {
      setRecords([]);
      setThisMonthChallengeCount(0);
      return;
    }

    const fetchRecords = async () => {
      try {
        setLoading(true);

        const data = await api.voice.getHistory(selectedChildId);

        const recordsForChild = data.transcripts
          .map((item: { id: string; created_at: string; transcript?: string }) => ({
            id: item.id,
            childId: selectedChildId,
            date: item.created_at,
            summary: item.transcript
              ? item.transcript.length > 30
                ? item.transcript.substring(0, 30) + '...'
                : item.transcript
              : 'チャレンジ記録',
          }))
          .sort(
            (a: ChallengeRecord, b: ChallengeRecord) =>
              parseISO(b.date).getTime() - parseISO(a.date).getTime()
          );

        setRecords(recordsForChild);

        const currentMonth = new Date();
        const count = recordsForChild.filter((record: ChallengeRecord) =>
          isSameMonth(parseISO(record.date), currentMonth)
        ).length;
        setThisMonthChallengeCount(count);
      } catch (error) {
        console.error('履歴取得エラー:', error);
        setError('履歴の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [selectedChildId]);

  return {
    records,
    thisMonthChallengeCount,
    loading,
    error,
    deletingId,
    handleDelete,
  };
}
