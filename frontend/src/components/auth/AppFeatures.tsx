'use client';

export function AppFeatures() {
  return (
    <div className="mb-8 p-4 bg-orange-50 rounded-xl">
      <p className="text-orange-500 text-base font-bold mb-4 text-center">BUDの特徴</p>
      <div className="space-y-4">
        <div>
          <p className="text-gray-800 text-sm font-medium">・困った時のサポート</p>
          <p className="text-gray-500 text-xs">会話中につまった時でも安心</p>
        </div>

        <div>
          <p className="text-gray-800 text-sm font-medium">・会話の内容を記録</p>
          <p className="text-gray-500 text-xs">自動で会話が記録され成長を確認できます</p>
        </div>

        <div>
          <p className="text-gray-800 text-sm font-medium">・フィードバック</p>
          <p className="text-gray-500 text-xs">AIが優しくアドバイスしてくれます</p>
        </div>
      </div>
    </div>
  );
}