'use client';

interface AccountSwitcherProps {
  onSwitchAccount: () => Promise<void>;
  loading: boolean;
}

export function AccountSwitcher({ onSwitchAccount, loading }: AccountSwitcherProps) {
  return (
    <div className="text-center space-y-3">
      <button
        onClick={onSwitchAccount}
        disabled={loading}
        className="text-base text-blue-500 hover:text-blue-600 underline transition-colors disabled:text-blue-300 font-medium py-2"
      >
        別のGoogleアカウントを使用
      </button>

      <p className="text-xs text-gray-500">
        すでにBUDをご利用の方で、
        <br />
        異なるアカウントに切り替えたい場合
      </p>
    </div>
  );
}