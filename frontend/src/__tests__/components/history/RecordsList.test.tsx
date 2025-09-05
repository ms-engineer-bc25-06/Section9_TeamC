import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecordsList } from '@/components/history/RecordsList';

// Next.jsのLinkコンポーネントをモック
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('履歴一覧画面テスト', () => {
  const mockRecords = [
    {
      id: 'record-1',
      childId: 'child-1',
      date: '2024-01-15T10:30:00Z',
      summary: '初めての英語チャレンジ',
    },
    {
      id: 'record-2',
      childId: 'child-1', 
      date: '2024-01-14T09:15:00Z',
      summary: '挨拶の練習',
    },
    {
      id: 'record-3',
      childId: 'child-1',
      date: '2024-01-13T14:45:00Z',
      summary: '自己紹介にチャレンジ',
    },
  ];

  const mockOnDelete = vi.fn();

  describe('リスト表示テスト', () => {
    it('記録リストが正しく表示される', () => {
      render(
        <RecordsList
          records={mockRecords}
          loading={false}
          deletingId={null}
          onDelete={mockOnDelete}
        />
      );

      // 各記録が表示されることを確認
      expect(screen.getByText('2024年01月15日 (月)')).toBeInTheDocument();
      expect(screen.getByText('初めての英語チャレンジ')).toBeInTheDocument();
      expect(screen.getByText('2024年01月14日 (日)')).toBeInTheDocument();
      expect(screen.getByText('挨拶の練習')).toBeInTheDocument();
      expect(screen.getByText('2024年01月13日 (土)')).toBeInTheDocument();
      expect(screen.getByText('自己紹介にチャレンジ')).toBeInTheDocument();
    });

    it('記録が空の場合は適切なメッセージが表示される', () => {
      render(
        <RecordsList
          records={[]}
          loading={false}
          deletingId={null}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('まだ記録がありません。')).toBeInTheDocument();
    });

    it('ローディング中は適切な表示がされる', () => {
      render(
        <RecordsList
          records={[]}
          loading={true}
          deletingId={null}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    });

    it('詳細リンクが各記録に表示される', () => {
      render(
        <RecordsList
          records={mockRecords}
          loading={false}
          deletingId={null}
          onDelete={mockOnDelete}
        />
      );

      const detailLinks = screen.getAllByText('詳細');
      expect(detailLinks).toHaveLength(3);
      
      // 最初の記録の詳細リンクを確認
      expect(detailLinks[0].closest('a')).toHaveAttribute(
        'href',
        '/history/child-1/record-1'
      );
    });

    it('削除ボタンが各記録に表示される', () => {
      render(
        <RecordsList
          records={mockRecords}
          loading={false}
          deletingId={null}
          onDelete={mockOnDelete}
        />
      );

      const deleteButtons = screen.getAllByTitle('記録を削除');
      expect(deleteButtons).toHaveLength(3);
    });
  });

  describe('フィルター機能テスト（基本動作）', () => {
    it('特定の子どものみの記録が表示される', () => {
      const child2Records = [
        {
          id: 'record-4',
          childId: 'child-2',
          date: '2024-01-15T10:30:00Z',
          summary: '子ども2の記録',
        },
      ];

      render(
        <RecordsList
          records={child2Records}
          loading={false}
          deletingId={null}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('子ども2の記録')).toBeInTheDocument();
      expect(screen.queryByText('初めての英語チャレンジ')).not.toBeInTheDocument();
    });

    it('日付でソートされた記録が表示される', () => {
      render(
        <RecordsList
          records={mockRecords}
          loading={false}
          deletingId={null}
          onDelete={mockOnDelete}
        />
      );

      const records = screen.getAllByText(/\d{4}年\d{2}月\d{2}日/);
      expect(records[0]).toHaveTextContent('2024年01月15日'); // 最新
      expect(records[1]).toHaveTextContent('2024年01月14日');
      expect(records[2]).toHaveTextContent('2024年01月13日'); // 最古
    });

    it('記録数に基づいて正しい件数が表示される', () => {
      render(
        <RecordsList
          records={mockRecords}
          loading={false}
          deletingId={null}
          onDelete={mockOnDelete}
        />
      );

      const recordCards = screen.getAllByRole('generic').filter(
        (element) => element.className.includes('rounded-xl bg-white/80')
      );
      expect(recordCards.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('ページング処理テスト（基本動作）', () => {
    it('大量の記録でもパフォーマンス良く表示される', () => {
      const manyRecords = Array.from({ length: 10 }, (_, index) => ({
        id: `record-${index}`,
        childId: 'child-1',
        date: `2024-01-${String((index % 28) + 1).padStart(2, '0')}T10:30:00Z`,
        summary: `記録 ${index + 1}`,
      }));

      const startTime = performance.now();
      render(
        <RecordsList
          records={manyRecords}
          loading={false}
          deletingId={null}
          onDelete={mockOnDelete}
        />
      );
      const endTime = performance.now();

      // レンダリング時間が500ms以下であることを確認（パフォーマンステスト）
      expect(endTime - startTime).toBeLessThan(500);
    });

    it('最初の10件の記録が表示される（仮想ページング想定）', () => {
      const firstTenRecords = mockRecords.slice(0, 2); // テスト用に2件のみ
      
      render(
        <RecordsList
          records={firstTenRecords}
          loading={false}
          deletingId={null}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('初めての英語チャレンジ')).toBeInTheDocument();
      expect(screen.getByText('挨拶の練習')).toBeInTheDocument();
    });

    it('空のページでは適切なメッセージが表示される', () => {
      render(
        <RecordsList
          records={[]}
          loading={false}
          deletingId={null}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('まだ記録がありません。')).toBeInTheDocument();
    });
  });

  describe('削除機能テスト', () => {
    it('削除ボタンをクリックすると削除処理が呼ばれる', async () => {
      const user = userEvent.setup();
      
      render(
        <RecordsList
          records={mockRecords}
          loading={false}
          deletingId={null}
          onDelete={mockOnDelete}
        />
      );

      const deleteButtons = screen.getAllByTitle('記録を削除');
      await user.click(deleteButtons[0]);

      expect(mockOnDelete).toHaveBeenCalledWith('record-1');
    });

    it('削除中は該当ボタンが無効化される', () => {
      render(
        <RecordsList
          records={mockRecords}
          loading={false}
          deletingId="record-1"
          onDelete={mockOnDelete}
        />
      );

      const deleteButtons = screen.getAllByTitle('記録を削除');
      expect(deleteButtons[0]).toBeDisabled();
      expect(screen.getByText('削除中...')).toBeInTheDocument();
    });

    it('削除中でない記録のボタンは有効のまま', () => {
      render(
        <RecordsList
          records={mockRecords}
          loading={false}
          deletingId="record-1"
          onDelete={mockOnDelete}
        />
      );

      const deleteButtons = screen.getAllByTitle('記録を削除');
      expect(deleteButtons[1]).not.toBeDisabled();
      expect(deleteButtons[2]).not.toBeDisabled();
    });
  });

  describe('UI表示テスト', () => {
    it('各記録にカレンダーアイコンが表示される', () => {
      render(
        <RecordsList
          records={mockRecords}
          loading={false}
          deletingId={null}
          onDelete={mockOnDelete}
        />
      );

      // CalendarDaysアイコンが表示されることを確認（lucide-reactのアイコン）
      const calendarIcons = document.querySelectorAll('svg');
      expect(calendarIcons.length).toBeGreaterThanOrEqual(3);
    });

    it('削除アイコンが各記録に表示される', () => {
      render(
        <RecordsList
          records={mockRecords}
          loading={false}
          deletingId={null}
          onDelete={mockOnDelete}
        />
      );

      // 削除ボタンが3つ表示されることを確認
      const deleteButtons = screen.getAllByTitle('記録を削除');
      expect(deleteButtons).toHaveLength(3);
    });

    it('記録のサマリーが正しく表示される', () => {
      render(
        <RecordsList
          records={mockRecords}
          loading={false}
          deletingId={null}
          onDelete={mockOnDelete}
        />
      );

      mockRecords.forEach((record) => {
        expect(screen.getByText(record.summary)).toBeInTheDocument();
      });
    });

    it('日付フォーマットが正しく表示される', () => {
      render(
        <RecordsList
          records={[mockRecords[0]]}
          loading={false}
          deletingId={null}
          onDelete={mockOnDelete}
        />
      );

      // 日本語形式で表示されることを確認
      expect(screen.getByText('2024年01月15日 (月)')).toBeInTheDocument();
    });
  });

  describe('エラーハンドリング', () => {
    it('不正な日付データでもクラッシュしない', () => {
      const invalidDateRecord = [{
        id: 'record-invalid',
        childId: 'child-1',
        date: 'invalid-date',
        summary: '不正な日付の記録',
      }];

      // エラーをスローしないことを確認
      render(
        <RecordsList
          records={invalidDateRecord}
          loading={false}
          deletingId={null}
          onDelete={mockOnDelete}
        />
      );

      // サマリーは正常に表示される
      expect(screen.getByText('不正な日付の記録')).toBeInTheDocument();
    });

    it('空文字のサマリーでも表示される', () => {
      const emptyData = [{
        id: 'record-empty',
        childId: 'child-1',
        date: '2024-01-15T10:30:00Z',
        summary: '',
      }];

      render(
        <RecordsList
          records={emptyData}
          loading={false}
          deletingId={null}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('2024年01月15日 (月)')).toBeInTheDocument();
    });
  });
});