'use client';

export function NewUserInfo() {
  return (
    <div className="mb-6 px-4 sm:px-6 py-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-blue-400 mt-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-blue-800">初めての方へ</h3>
          <p className="mt-1 text-xs text-blue-700 leading-relaxed">
            Googleでログインすると、
            <br />
            BUDアカウントが自動で作成されます
          </p>
        </div>
      </div>
    </div>
  );
}