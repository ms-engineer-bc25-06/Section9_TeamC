'use client';

interface UserHeaderProps {
  userName: string;
  onLogout: () => Promise<void>;
}

export function UserHeader({ userName, onLogout }: UserHeaderProps) {
  return (
    <header className="w-full max-w-4xl flex justify-between items-center mb-4 px-2 sm:px-0">
      <div>
        <p className="text-gray-600 text-sm sm:text-lg">
          {userName}さん、
          <br />
          お子さまを応援するよ！
        </p>
      </div>
      <button
        onClick={onLogout}
        className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-500 text-white text-sm sm:text-base rounded-md hover:bg-red-600"
      >
        ログアウト
      </button>
    </header>
  );
}