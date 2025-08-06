import AuthTest from "@/components/auth/AuthTest";

export default function AuthTestPage() {
  return (
    <div style={{ padding: "20px" }}>
      <h1>🔥 Firebase Authentication Test (V0統合版)</h1>
      <p>Next.js 15.4.5 + React 19.1.0 + Firebase 10.12.5 動作確認</p>

      <AuthTest />

      <div
        style={{
          marginTop: "20px",
          padding: "10px",
          backgroundColor: "#f5f5f5",
        }}
      >
        <h4>📋 テスト項目:</h4>
        <ul>
          <li>新しいディレクトリ構造での動作</li>
          <li>Next.js 15 + React 19 環境での Firebase認証</li>
          <li>import パス解決の確認</li>
          <li>Google認証フローの動作</li>
        </ul>

        <h4>🎯 確認ポイント:</h4>
        <ol>
          <li>ページが正常に表示される</li>
          <li>「Googleログイン」ボタンが機能する</li>
          <li>認証後のユーザー情報が表示される</li>
          <li>ログアウトが正常に動作する</li>
        </ol>
      </div>
    </div>
  );
}
