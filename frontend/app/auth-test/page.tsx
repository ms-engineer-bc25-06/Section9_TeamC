import AuthTest from "@/components/auth/AuthTest";

export default function AuthTestPage() {
  return (
    <div style={{ padding: "20px" }}>
      <h1>🔥 Firebase Authentication Test</h1>
      <p>Google認証の動作確認ページです</p>

      <AuthTest />

      <div
        style={{
          marginTop: "20px",
          padding: "10px",
          backgroundColor: "#f5f5f5",
        }}
      >
        <h4>📋 テスト手順:</h4>
        <ol>
          <li>「Googleログイン」ボタンをクリック</li>
          <li>Googleアカウントを選択</li>
          <li>ログイン情報が表示されることを確認</li>
          <li>「ログアウト」ボタンをクリック</li>
          <li>未ログイン状態に戻ることを確認</li>
        </ol>
      </div>
    </div>
  );
}
