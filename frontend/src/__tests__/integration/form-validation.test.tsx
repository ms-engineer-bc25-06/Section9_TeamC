import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { validateNickname, validateBirthdate } from '@/utils/validation';

// 簡単なフォームコンポーネント（テスト用）
interface FormData {
  nickname: string;
  birthdate: string;
}

interface SimpleFormProps {
  onSubmit: (data: FormData) => Promise<void>;
  onError?: (errors: Record<string, string>) => void;
}

const SimpleForm: React.FC<SimpleFormProps> = ({ onSubmit, onError }) => {
  const [formData, setFormData] = React.useState<FormData>({
    nickname: '',
    birthdate: '',
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const nicknameError = validateNickname(formData.nickname);
    if (nicknameError) {
      newErrors.nickname = nicknameError;
    }

    const birthdateError = validateBirthdate(formData.birthdate);
    if (birthdateError) {
      newErrors.birthdate = birthdateError;
    }

    setErrors(newErrors);
    if (onError && Object.keys(newErrors).length > 0) {
      onError(newErrors);
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      // 成功時はフォームをリセット
      setFormData({ nickname: '', birthdate: '' });
      setErrors({});
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} data-testid="simple-form">
      <div>
        <label htmlFor="nickname">ニックネーム</label>
        <input
          id="nickname"
          type="text"
          value={formData.nickname}
          onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
          disabled={isSubmitting}
        />
        {errors.nickname && (
          <div data-testid="nickname-error" role="alert">
            {errors.nickname}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="birthdate">誕生日</label>
        <input
          id="birthdate"
          type="date"
          value={formData.birthdate}
          onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
          disabled={isSubmitting}
        />
        {errors.birthdate && (
          <div data-testid="birthdate-error" role="alert">
            {errors.birthdate}
          </div>
        )}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? '送信中...' : '送信'}
      </button>
    </form>
  );
};

describe('フォーム統合テスト', () => {
  describe('フォームバリデーション', () => {
    it('有効なデータでフォームが送信される', async () => {
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();

      render(<SimpleForm onSubmit={mockOnSubmit} />);

      // 有効なデータを入力
      await user.type(screen.getByLabelText('ニックネーム'), 'テスト太郎');
      await user.type(screen.getByLabelText('誕生日'), '2020-01-01');

      // フォームを送信
      await user.click(screen.getByRole('button', { name: /送信/ }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          nickname: 'テスト太郎',
          birthdate: '2020-01-01',
        });
      });
    });

    it('ニックネームが空の場合エラーが表示される', async () => {
      const mockOnSubmit = vi.fn();
      const mockOnError = vi.fn();
      const user = userEvent.setup();

      render(<SimpleForm onSubmit={mockOnSubmit} onError={mockOnError} />);

      // 空のニックネームで送信
      await user.click(screen.getByRole('button', { name: /送信/ }));

      await waitFor(() => {
        expect(screen.getByTestId('nickname-error')).toHaveTextContent('ニックネームは必須です');
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
      expect(mockOnError).toHaveBeenCalledWith({
        nickname: 'ニックネームは必須です',
      });
    });

    it('未来の日付を入力した場合エラーが表示される', async () => {
      const mockOnSubmit = vi.fn();
      const mockOnError = vi.fn();
      const user = userEvent.setup();

      render(<SimpleForm onSubmit={mockOnSubmit} onError={mockOnError} />);

      // 未来の日付を入力
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      await user.type(screen.getByLabelText('ニックネーム'), 'テスト太郎');
      await user.type(screen.getByLabelText('誕生日'), tomorrowStr);

      await user.click(screen.getByRole('button', { name: /送信/ }));

      await waitFor(() => {
        expect(screen.getByTestId('birthdate-error')).toHaveTextContent(
          '未来の日付は入力できません'
        );
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('複数のバリデーションエラーが同時に表示される', async () => {
      const mockOnSubmit = vi.fn();
      const mockOnError = vi.fn();
      const user = userEvent.setup();

      render(<SimpleForm onSubmit={mockOnSubmit} onError={mockOnError} />);

      // 未来の日付を入力（ニックネームは空のまま）
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      await user.type(screen.getByLabelText('誕生日'), tomorrowStr);
      await user.click(screen.getByRole('button', { name: /送信/ }));

      await waitFor(() => {
        expect(screen.getByTestId('nickname-error')).toBeInTheDocument();
        expect(screen.getByTestId('birthdate-error')).toBeInTheDocument();
      });

      expect(mockOnError).toHaveBeenCalledWith({
        nickname: 'ニックネームは必須です',
        birthdate: '未来の日付は入力できません',
      });
    });
  });

  describe('保存処理とエラーハンドリング', () => {
    it('送信中はボタンが無効になる', async () => {
      let resolvePromise: () => void;
      const mockOnSubmit = vi.fn().mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolvePromise = resolve;
          })
      );
      const user = userEvent.setup();

      render(<SimpleForm onSubmit={mockOnSubmit} />);

      await user.type(screen.getByLabelText('ニックネーム'), 'テスト太郎');
      await user.click(screen.getByRole('button', { name: /送信/ }));

      // 送信中はボタンが無効化され、テキストが変更される
      const submitButton = screen.getByRole('button', { name: /送信中/ });
      expect(submitButton).toBeDisabled();

      // 入力フィールドも無効化される
      expect(screen.getByLabelText('ニックネーム')).toBeDisabled();
      expect(screen.getByLabelText('誕生日')).toBeDisabled();

      // プロミスを解決
      resolvePromise!();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /送信$/ })).not.toBeDisabled();
      });
    });

    it('送信成功後にフォームがリセットされる', async () => {
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();

      render(<SimpleForm onSubmit={mockOnSubmit} />);

      const nicknameInput = screen.getByLabelText('ニックネーム');
      const birthdateInput = screen.getByLabelText('誕生日');

      await user.type(nicknameInput, 'テスト太郎');
      await user.type(birthdateInput, '2020-01-01');

      expect(nicknameInput).toHaveValue('テスト太郎');
      expect(birthdateInput).toHaveValue('2020-01-01');

      await user.click(screen.getByRole('button', { name: /送信/ }));

      await waitFor(() => {
        expect(nicknameInput).toHaveValue('');
        expect(birthdateInput).toHaveValue('');
      });
    });

    it('送信エラー時にフォームの状態が保持される', async () => {
      const mockOnSubmit = vi.fn().mockRejectedValue(new Error('Server error'));
      const user = userEvent.setup();

      render(<SimpleForm onSubmit={mockOnSubmit} />);

      const nicknameInput = screen.getByLabelText('ニックネーム');
      const birthdateInput = screen.getByLabelText('誕生日');

      await user.type(nicknameInput, 'テスト太郎');
      await user.type(birthdateInput, '2020-01-01');

      await user.click(screen.getByRole('button', { name: /送信/ }));

      // エラー発生後もフォームの値は保持される
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /送信$/ })).not.toBeDisabled();
      });

      expect(nicknameInput).toHaveValue('テスト太郎');
      expect(birthdateInput).toHaveValue('2020-01-01');
    });
  });

  describe('アクセシビリティ', () => {
    it('エラーメッセージにrole="alert"が設定される', async () => {
      const mockOnSubmit = vi.fn();
      const user = userEvent.setup();

      render(<SimpleForm onSubmit={mockOnSubmit} />);

      await user.click(screen.getByRole('button', { name: /送信/ }));

      await waitFor(() => {
        const errorElement = screen.getByTestId('nickname-error');
        expect(errorElement).toHaveAttribute('role', 'alert');
      });
    });

    it('ラベルと入力フィールドが適切に関連付けられる', () => {
      render(<SimpleForm onSubmit={vi.fn()} />);

      const nicknameInput = screen.getByLabelText('ニックネーム');
      const birthdateInput = screen.getByLabelText('誕生日');

      expect(nicknameInput).toHaveAttribute('id', 'nickname');
      expect(birthdateInput).toHaveAttribute('id', 'birthdate');
    });
  });
});

// React のインポートを追加するヘルパー
import React from 'react';
