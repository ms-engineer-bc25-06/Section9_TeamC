import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import ChildrenPage from '@/app/(app)/children/page';
import { useAuth } from '@/hooks/useAuth';
import { useChildren } from '@/hooks/useChildren';
import { api } from '@/lib/api';
import { vi, Mock } from 'vitest';

// モック設定
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/hooks/useAuth');
vi.mock('@/hooks/useChildren');
vi.mock('@/lib/api', () => ({
  api: {
    auth: {
      test: vi.fn(),
    },
    children: {
      delete: vi.fn(),
    },
  },
}));

// Next.js Image コンポーネントのモック
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

const mockRouter = {
  push: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  replace: vi.fn(),
};

const mockUseAuth = useAuth as Mock;
const mockUseChildren = useChildren as Mock;

describe('ChildrenPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as Mock).mockReturnValue(mockRouter);

    // api.auth.test のデフォルトモック設定
    (api.auth.test as Mock).mockResolvedValue({
      name: 'バックエンドユーザー',
    });
  });

  describe('ローディング状態', () => {
    it('認証ローディング中は読み込み表示を表示する', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        logout: vi.fn(),
      });

      mockUseChildren.mockReturnValue({
        children: [],
        isLoading: false,
        error: null,
      });

      render(<ChildrenPage />);

      expect(screen.getByText('🔄 読み込み中...')).toBeInTheDocument();
    });

    it('子どもデータローディング中は読み込み表示を表示する', async () => {
      mockUseAuth.mockReturnValue({
        user: { displayName: 'テストユーザー' },
        loading: false,
        logout: vi.fn(),
      });

      mockUseChildren.mockReturnValue({
        children: [],
        isLoading: true,
        error: null,
      });

      await act(async () => {
        render(<ChildrenPage />);
      });

      expect(screen.getByText('🔄 読み込み中...')).toBeInTheDocument();
    });
  });

  describe('ヘッダー表示', () => {
    const setupMocks = (user = { displayName: 'テストユーザー' }) => {
      mockUseAuth.mockReturnValue({
        user,
        loading: false,
        logout: vi.fn().mockResolvedValue({ success: true }),
      });

      mockUseChildren.mockReturnValue({
        children: [],
        isLoading: false,
        error: null,
      });
    };

    it('バックエンドから取得したユーザー名を表示する', async () => {
      setupMocks();

      await act(async () => {
        render(<ChildrenPage />);
      });

      expect(screen.getByText(/バックエンドユーザーさん、/)).toBeInTheDocument();
      expect(screen.getByText(/お子さまを応援するよ！/)).toBeInTheDocument();
    });

    it('バックエンドAPIが失敗した場合はFirebaseの情報を使用する', async () => {
      // バックエンドAPIを失敗させる
      (api.auth.test as Mock).mockRejectedValueOnce(new Error('API失敗'));

      setupMocks({ displayName: 'Google User' });

      await act(async () => {
        render(<ChildrenPage />);
      });

      expect(screen.getByText(/Google Userさん、/)).toBeInTheDocument();
    });

    it('ログアウトボタンが表示される', async () => {
      setupMocks();

      await act(async () => {
        render(<ChildrenPage />);
      });

      expect(screen.getByText('ログアウト')).toBeInTheDocument();
    });

    it('ログアウトボタンクリックで処理が実行される', async () => {
      const mockLogout = vi.fn().mockResolvedValue({ success: true });
      mockUseAuth.mockReturnValue({
        user: { displayName: 'テストユーザー' },
        loading: false,
        logout: mockLogout,
      });

      mockUseChildren.mockReturnValue({
        children: [],
        isLoading: false,
        error: null,
      });

      await act(async () => {
        render(<ChildrenPage />);
      });

      await act(async () => {
        fireEvent.click(screen.getByText('ログアウト'));
      });

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
        expect(mockRouter.push).toHaveBeenCalledWith('/');
      });
    });
  });

  describe('メインコンテンツ表示', () => {
    const setupMocks = () => {
      mockUseAuth.mockReturnValue({
        user: { displayName: 'テストユーザー' },
        loading: false,
        logout: vi.fn(),
      });

      mockUseChildren.mockReturnValue({
        children: [],
        isLoading: false,
        error: null,
      });
    };

    it('メインタイトルが表示される', async () => {
      setupMocks();

      await act(async () => {
        render(<ChildrenPage />);
      });

      expect(screen.getByText('がんばってみよう')).toBeInTheDocument();
    });

    it('エラーメッセージが表示される', async () => {
      mockUseAuth.mockReturnValue({
        user: { displayName: 'テストユーザー' },
        loading: false,
        logout: vi.fn(),
      });

      mockUseChildren.mockReturnValue({
        children: [],
        isLoading: false,
        error: 'データの取得に失敗しました',
      });

      await act(async () => {
        render(<ChildrenPage />);
      });

      expect(screen.getByText('エラー: データの取得に失敗しました')).toBeInTheDocument();
    });
  });

  describe('子ども一覧表示', () => {
    it('子どもが0人の場合、空状態を表示する', async () => {
      mockUseAuth.mockReturnValue({
        user: { displayName: 'テストユーザー' },
        loading: false,
        logout: vi.fn(),
      });

      mockUseChildren.mockReturnValue({
        children: [],
        isLoading: false,
        error: null,
      });

      await act(async () => {
        render(<ChildrenPage />);
      });

      // 子どもカードが表示されていないことを確認
      expect(screen.queryByText('スタート')).not.toBeInTheDocument();
    });

    it('子ども一覧を正しく表示する', async () => {
      mockUseAuth.mockReturnValue({
        user: { displayName: 'テストユーザー' },
        loading: false,
        logout: vi.fn(),
      });

      // 実際の年齢計算に合わせたモックデータ
      const currentYear = new Date().getFullYear();
      const mockChildren = [
        {
          id: '1',
          name: '太郎',
          age: currentYear - 2018, // 2018年生まれ = 6歳 (2024年基準)
          birthdate: '2018-01-01',
        },
        {
          id: '2',
          name: '花子',
          age: currentYear - 2016, // 2016年生まれ = 8歳 (2024年基準)
          birthdate: '2016-01-01',
        },
      ];

      mockUseChildren.mockReturnValue({
        children: mockChildren,
        isLoading: false,
        error: null,
      });

      await act(async () => {
        render(<ChildrenPage />);
      });

      // 子どもの名前が表示される
      expect(screen.getByText('太郎')).toBeInTheDocument();
      expect(screen.getByText('花子')).toBeInTheDocument();

      // 実際に表示されている年齢をテスト（動的に計算される）
      const taro = screen.getByText('太郎').closest('div');
      const hanako = screen.getByText('花子').closest('div');

      expect(taro).toHaveTextContent('歳');
      expect(hanako).toHaveTextContent('歳');

      // スタートボタンが表示される
      expect(screen.getAllByText('スタート')).toHaveLength(2);
    });

    it('子どもカードのスタートボタンクリックで遷移する', async () => {
      mockUseAuth.mockReturnValue({
        user: { displayName: 'テストユーザー' },
        loading: false,
        logout: vi.fn(),
      });

      const mockChildren = [{ id: '1', name: '太郎', age: 5 }];

      mockUseChildren.mockReturnValue({
        children: mockChildren,
        isLoading: false,
        error: null,
      });

      await act(async () => {
        render(<ChildrenPage />);
      });

      await act(async () => {
        fireEvent.click(screen.getByText('スタート'));
      });

      expect(mockRouter.push).toHaveBeenCalledWith('/children/confirm?childId=1');
    });
  });

  describe('フッターボタン', () => {
    const setupMocks = () => {
      mockUseAuth.mockReturnValue({
        user: { displayName: 'テストユーザー' },
        loading: false,
        logout: vi.fn(),
      });

      mockUseChildren.mockReturnValue({
        children: [],
        isLoading: false,
        error: null,
      });
    };

    it('フッターボタンが全て表示される', async () => {
      setupMocks();

      await act(async () => {
        render(<ChildrenPage />);
      });

      expect(screen.getByText('なまえをつくる')).toBeInTheDocument();
      expect(screen.getByText('ふりかえり')).toBeInTheDocument();
      expect(screen.getByText('ステップアップ')).toBeInTheDocument();
    });

    it('なまえをつくるボタンクリックで子ども登録画面に遷移', async () => {
      setupMocks();

      await act(async () => {
        render(<ChildrenPage />);
      });

      await act(async () => {
        fireEvent.click(screen.getByText('なまえをつくる'));
      });

      expect(mockRouter.push).toHaveBeenCalledWith('/children/register');
    });

    it('ふりかえりボタンクリックで履歴画面に遷移', async () => {
      setupMocks();

      await act(async () => {
        render(<ChildrenPage />);
      });

      await act(async () => {
        fireEvent.click(screen.getByText('ふりかえり'));
      });

      expect(mockRouter.push).toHaveBeenCalledWith('/history');
    });

    it('ステップアップボタンクリックでアップグレード画面に遷移', async () => {
      setupMocks();

      await act(async () => {
        render(<ChildrenPage />);
      });

      await act(async () => {
        fireEvent.click(screen.getByText('ステップアップ'));
      });

      expect(mockRouter.push).toHaveBeenCalledWith('/upgrade');
    });
  });
});
