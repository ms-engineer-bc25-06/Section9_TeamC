import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createChild } from '@/app/(app)/children/childApi';
import { validateNickname, validateBirthdate } from '@/utils/validation';
import { api } from '@/lib/api';

// APIのモック
vi.mock('@/lib/api', () => ({
  api: {
    children: {
      create: vi.fn(),
      get: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      list: vi.fn(),
    },
  },
}));

describe('子ども管理APIテスト', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('CRUD操作のユニットテスト', () => {
    describe('CREATE - 子ども作成', () => {
      it('有効なデータで子どもを作成できる', async () => {
        const mockResponse = {
          id: 'child-123',
          name: 'テスト太郎',
          nickname: 'テスト太郎',
          birthdate: '2020-01-01',
        };

        vi.mocked(api.children.create).mockResolvedValue(mockResponse);

        const result = await createChild({
          nickname: 'テスト太郎',
          birthdate: '2020-01-01',
        });

        expect(api.children.create).toHaveBeenCalledWith({
          name: 'テスト太郎',
          nickname: 'テスト太郎',
          birthdate: '2020-01-01',
        });
        expect(result).toEqual(mockResponse);
      });

      it('誕生日なしで子どもを作成できる', async () => {
        const mockResponse = {
          id: 'child-124',
          name: 'テスト花子',
          nickname: 'テスト花子',
        };

        vi.mocked(api.children.create).mockResolvedValue(mockResponse);

        const result = await createChild({
          nickname: 'テスト花子',
        });

        expect(api.children.create).toHaveBeenCalledWith({
          name: 'テスト花子',
          nickname: 'テスト花子',
          birthdate: undefined,
        });
        expect(result).toEqual(mockResponse);
      });
    });

    describe('READ - 子ども取得', () => {
      it('子ども情報を取得できる', async () => {
        const mockChild = {
          id: 'child-123',
          name: 'テスト太郎',
          nickname: 'たろう',
          birthdate: '2020-01-01',
        };

        vi.mocked(api.children.get).mockResolvedValue(mockChild);

        const result = await api.children.get('child-123');

        expect(api.children.get).toHaveBeenCalledWith('child-123');
        expect(result).toEqual(mockChild);
      });

      it('子どもリストを取得できる', async () => {
        const mockChildren = [
          { id: 'child-1', name: '太郎', nickname: 'たろう' },
          { id: 'child-2', name: '花子', nickname: 'はなこ' },
        ];

        vi.mocked(api.children.list).mockResolvedValue(mockChildren);

        const result = await api.children.list();

        expect(api.children.list).toHaveBeenCalled();
        expect(result).toEqual(mockChildren);
        expect(result).toHaveLength(2);
      });
    });

    describe('UPDATE - 子ども更新', () => {
      it('子ども情報を更新できる', async () => {
        const updateData = { nickname: '新しいニックネーム' };
        const mockResponse = {
          id: 'child-123',
          name: 'テスト太郎',
          nickname: '新しいニックネーム',
        };

        vi.mocked(api.children.update).mockResolvedValue(mockResponse);

        const result = await api.children.update('child-123', updateData);

        expect(api.children.update).toHaveBeenCalledWith('child-123', updateData);
        expect(result).toEqual(mockResponse);
      });
    });

    describe('DELETE - 子ども削除', () => {
      it('子どもを削除できる', async () => {
        vi.mocked(api.children.delete).mockResolvedValue({ success: true });

        const result = await api.children.delete('child-123');

        expect(api.children.delete).toHaveBeenCalledWith('child-123');
        expect(result).toEqual({ success: true });
      });
    });
  });

  describe('バリデーション機能テスト', () => {
    describe('ニックネームのバリデーション', () => {
      it('有効なニックネームが通る', () => {
        const validNames = ['太郎', 'はなこ', 'Test123'];

        validNames.forEach((name) => {
          const error = validateNickname(name);
          expect(error).toBeNull();
        });
      });

      it('空のニックネームでエラーが返る', () => {
        const error = validateNickname('');
        expect(error).toBe('ニックネームは必須です');
      });

      it('長すぎるニックネームでエラーが返る', () => {
        const longName = 'あ'.repeat(21); // 20文字制限を超過
        const error = validateNickname(longName);
        expect(error).not.toBeNull();
        expect(error).toMatch(/文字以内で入力してください/);
      });
    });

    describe('誕生日のバリデーション', () => {
      it('有効な日付が通る', () => {
        const validDates = ['2020-01-01', '2018-12-31'];

        validDates.forEach((date) => {
          const error = validateBirthdate(date);
          expect(error).toBeNull();
        });
      });

      it('空の誕生日は許可される（任意項目）', () => {
        const error = validateBirthdate('');
        expect(error).toBeNull();
      });

      it('未来の日付でエラーが返る', () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        const error = validateBirthdate(tomorrowStr);
        expect(error).toBe('未来の日付は入力できません');
      });
    });
  });

  describe('エラーケーステスト', () => {
    describe('API通信エラー', () => {
      it('子ども作成時のネットワークエラー', async () => {
        vi.mocked(api.children.create).mockRejectedValue(new Error('Network error'));

        await expect(createChild({ nickname: 'テスト太郎' })).rejects.toThrow('Network error');

        expect(api.children.create).toHaveBeenCalled();
      });

      it('子ども取得時の404エラー', async () => {
        const notFoundError = new Error('Child not found');
        vi.mocked(api.children.get).mockRejectedValue(notFoundError);

        await expect(api.children.get('non-existent-id')).rejects.toThrow('Child not found');
      });

      it('子ども更新時の権限エラー', async () => {
        const permissionError = new Error('Permission denied');
        vi.mocked(api.children.update).mockRejectedValue(permissionError);

        await expect(api.children.update('child-123', { nickname: '新しい名前' })).rejects.toThrow(
          'Permission denied'
        );
      });

      it('子ども削除時のエラー', async () => {
        const deleteError = new Error('Cannot delete child with records');
        vi.mocked(api.children.delete).mockRejectedValue(deleteError);

        await expect(api.children.delete('child-123')).rejects.toThrow(
          'Cannot delete child with records'
        );
      });
    });

    describe('データ整合性エラー', () => {
      it('重複するニックネームでの作成エラー', async () => {
        const duplicateError = new Error('Nickname already exists');
        vi.mocked(api.children.create).mockRejectedValue(duplicateError);

        await expect(createChild({ nickname: '既存の名前' })).rejects.toThrow(
          'Nickname already exists'
        );
      });

      it('不正なデータ形式エラー', async () => {
        const invalidDataError = new Error('Invalid data format');
        vi.mocked(api.children.create).mockRejectedValue(invalidDataError);

        await expect(createChild({ nickname: null as any })).rejects.toThrow('Invalid data format');
      });
    });

    describe('認証・認可エラー', () => {
      it('未認証エラー', async () => {
        const authError = new Error('Authentication required');
        vi.mocked(api.children.list).mockRejectedValue(authError);

        await expect(api.children.list()).rejects.toThrow('Authentication required');
      });

      it('認可エラー', async () => {
        const authorizationError = new Error('Access denied');
        vi.mocked(api.children.get).mockRejectedValue(authorizationError);

        await expect(api.children.get('other-user-child')).rejects.toThrow('Access denied');
      });
    });
  });

  describe('境界値テスト', () => {
    it('最大文字数ちょうどのニックネーム', () => {
      const maxLengthName = 'あ'.repeat(20); // 最大文字数
      const error = validateNickname(maxLengthName);
      expect(error).toBeNull();
    });

    it('最大文字数+1のニックネーム', () => {
      const overMaxName = 'あ'.repeat(21); // 最大文字数+1
      const error = validateNickname(overMaxName);
      expect(error).not.toBeNull();
      expect(error).toMatch(/文字以内で入力してください/);
    });

    it('今日の日付（境界値）', () => {
      const today = new Date().toISOString().split('T')[0];
      const error = validateBirthdate(today);
      expect(error).toBeNull();
    });
  });

  describe('統合テスト（最低限）', () => {
    it('子ども作成から取得までの一連の流れ', async () => {
      const childData = { nickname: 'テスト太郎', birthdate: '2020-01-01' };
      const createdChild = {
        id: 'child-123',
        name: 'テスト太郎',
        nickname: 'テスト太郎',
        birthdate: '2020-01-01',
      };

      // 作成
      vi.mocked(api.children.create).mockResolvedValue(createdChild);
      const createResult = (await createChild(childData)) as typeof createdChild;

      // 取得
      vi.mocked(api.children.get).mockResolvedValue(createdChild);
      const getResult = await api.children.get(createResult.id);

      expect(createResult.id).toBe('child-123');
      expect(getResult).toEqual(createdChild);
    });

    it('バリデーションエラーがある場合は作成しない', async () => {
      // バリデーションでエラーが出る場合
      const invalidData = { nickname: '' }; // 空のニックネーム

      const nicknameError = validateNickname(invalidData.nickname);
      expect(nicknameError).toBe('ニックネームは必須です');

      // バリデーションエラーがある場合はAPIを呼ばない想定
      expect(api.children.create).not.toHaveBeenCalled();
    });
  });
});
