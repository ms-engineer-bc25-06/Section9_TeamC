import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import Home from '@/app/page';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { signOut, User } from 'firebase/auth';
import { vi } from 'vitest';

// モックの設定
vi.mock('next/navigation');
vi.mock('@/hooks/useAuth');
vi.mock('@/lib/api');
vi.mock('firebase/auth');
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

const mockPush = vi.fn();
const mockUseRouter = vi.mocked(useRouter);
const mockUseAuth = vi.mocked(useAuth);
const mockApi = vi.mocked(api);
const mockSignOut = vi.mocked(signOut);

describe('Login Page (ホーム画面 - ログイン機能)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    });
  });

  describe('正常系テスト', () => {
    test('コンポーネントが正常にレンダリングされる', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loginWithGoogle: vi.fn().mockResolvedValue({ success: true }),
        loginWithAccountSelection: vi.fn().mockResolvedValue({ success: true }),
        logout: vi.fn().mockResolvedValue({ success: true }),
        loading: false,
        isAuthenticated: false,
      });

      render(<Home />);

      // 主要な要素が表示されることを確認
      expect(screen.getByText('BUD')).toBeInTheDocument();
      expect(screen.getByText('お子様の英語の芽を育てよう！')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Googleでログイン' })).toBeInTheDocument();
      expect(screen.getByText('別のGoogleアカウントを使用')).toBeInTheDocument();
    });

    test('ログイン済みユーザーは子ども選択画面にリダイレクトされる', () => {
      mockUseAuth.mockReturnValue({
        user: { uid: 'test-uid', displayName: 'Test User' } as User,
        loginWithGoogle: vi.fn().mockResolvedValue({ success: true }),
        loginWithAccountSelection: vi.fn().mockResolvedValue({ success: true }),
        logout: vi.fn().mockResolvedValue({ success: true }),
        loading: false,
        isAuthenticated: true,
      });

      render(<Home />);

      expect(mockPush).toHaveBeenCalledWith('/children');
    });

    test('ローディング中は適切な表示がされる', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loginWithGoogle: vi.fn().mockResolvedValue({ success: true }),
        loginWithAccountSelection: vi.fn().mockResolvedValue({ success: true }),
        logout: vi.fn().mockResolvedValue({ success: true }),
        loading: true,
        isAuthenticated: false,
      });

      render(<Home />);

      expect(screen.getByText('確認中...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('異常系テスト', () => {
    test('Googleログインが失敗した場合のエラーハンドリング', async () => {
      const mockLoginWithGoogle = vi.fn().mockResolvedValue({
        success: false,
        error: 'Authentication failed',
      });

      mockUseAuth.mockReturnValue({
        user: null,
        loginWithGoogle: mockLoginWithGoogle,
        loginWithAccountSelection: vi.fn().mockResolvedValue({ success: true }),
        logout: vi.fn().mockResolvedValue({ success: true }),
        loading: false,
        isAuthenticated: false,
      });

      // console.error をモック
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<Home />);

      const loginButton = screen.getByRole('button', { name: 'Googleでログイン' });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(mockLoginWithGoogle).toHaveBeenCalled();
      });

      // エラーがログに記録されることを確認
      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Firebase認証失敗:', 'Authentication failed');

      consoleErrorSpy.mockRestore();
    });

    test('バックエンドAPI連携が失敗した場合のエラーハンドリング', async () => {
      const mockLoginWithGoogle = vi.fn().mockResolvedValue({
        success: true,
        user: { uid: 'test-uid', displayName: 'Test User' } as User,
      });

      mockUseAuth.mockReturnValue({
        user: null,
        loginWithGoogle: mockLoginWithGoogle,
        loginWithAccountSelection: vi.fn().mockResolvedValue({ success: true }),
        logout: vi.fn().mockResolvedValue({ success: true }),
        loading: false,
        isAuthenticated: false,
      });

      // APIログインを失敗させる
      mockApi.auth = {
        login: vi.fn().mockResolvedValue({ success: true }),
        test: vi.fn().mockResolvedValue({}),
        getProfile: vi.fn().mockResolvedValue({}),
        updateProfile: vi.fn().mockResolvedValue({}),
        getChildren: vi.fn().mockResolvedValue([]),
      };

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<Home />);

      const loginButton = screen.getByRole('button', { name: 'Googleでログイン' });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(mockApi.auth.login).toHaveBeenCalled();
      });

      // エラーがログに記録されることを確認
      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ バックエンド連携失敗:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });

  describe('インタラクションテスト', () => {
    test('アカウント切り替えボタンが正常に動作する', async () => {
      const mockLoginWithAccountSelection = vi.fn().mockResolvedValue({
        success: true,
        user: { uid: 'test-uid', displayName: 'Test User' } as User,
      });

      mockUseAuth.mockReturnValue({
        user: null,
        loginWithGoogle: vi.fn().mockResolvedValue({ success: true }),
        loginWithAccountSelection: mockLoginWithAccountSelection,
        logout: vi.fn().mockResolvedValue({ success: true }),
        loading: false,
        isAuthenticated: false,
      });

      mockApi.auth = {
        login: vi.fn().mockResolvedValue({ success: true }),
        test: vi.fn().mockResolvedValue({}),
        getProfile: vi.fn().mockResolvedValue({}),
        updateProfile: vi.fn().mockResolvedValue({}),
        getChildren: vi.fn().mockResolvedValue([]),
      };

      render(<Home />);

      const switchAccountButton = screen.getByText('別のGoogleアカウントを使用');
      fireEvent.click(switchAccountButton);

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
        expect(mockLoginWithAccountSelection).toHaveBeenCalled();
      });
    });

    test('ログイン処理が実行されることを確認', async () => {
      const mockLoginWithGoogle = vi.fn().mockResolvedValue({
        success: true,
        user: { uid: 'test-uid', displayName: 'Test User' } as User,
      });

      mockUseAuth.mockReturnValue({
        user: null,
        loginWithGoogle: mockLoginWithGoogle,
        loginWithAccountSelection: vi.fn().mockResolvedValue({ success: true }),
        logout: vi.fn().mockResolvedValue({ success: true }),
        loading: false,
        isAuthenticated: false,
      });

      mockApi.auth = {
        login: vi.fn().mockResolvedValue({ success: true }),
        test: vi.fn().mockResolvedValue({}),
        getProfile: vi.fn().mockResolvedValue({}),
        updateProfile: vi.fn().mockResolvedValue({}),
        getChildren: vi.fn().mockResolvedValue([]),
      };

      render(<Home />);

      const loginButton = screen.getByRole('button', { name: 'Googleでログイン' });
      fireEvent.click(loginButton);

      // ログイン関数が呼ばれることを確認
      await waitFor(() => {
        expect(mockLoginWithGoogle).toHaveBeenCalled();
      });
    });
  });
});
