"use client";

import { useAuth } from "@/hooks/useAuth";

export default function AuthTest() {
  const { user, loading, loginWithGoogle, logout, isAuthenticated } = useAuth();

  const handleLogin = async () => {
    console.log("🔥 ログイン開始");
    const result = await loginWithGoogle();

    if (result.success) {
      console.log("✅ ログイン成功:", result.user?.displayName);
    } else {
      console.error("❌ ログイン失敗:", result.error);
    }
  };

  const handleLogout = async () => {
    console.log("🚪 ログアウト開始");
    const result = await logout();

    if (result.success) {
      console.log("✅ ログアウト完了");
    }
  };

  if (loading) {
    return <div>🔄 認証状態確認中...</div>;
  }

  return (
    <div style={{ padding: "20px", border: "1px solid #ccc", margin: "10px" }}>
      <h3>🔥 Firebase Auth Test (カスタム実装)</h3>

      {isAuthenticated ? (
        <div>
          <p>✅ ログイン済み</p>
          <p>👤 ユーザー: {user?.displayName}</p>
          <p>📧 Email: {user?.email}</p>
          <p>🆔 UID: {user?.uid}</p>
          <button
            onClick={handleLogout}
            style={{ padding: "8px 16px", marginTop: "8px" }}
          >
            ログアウト
          </button>
        </div>
      ) : (
        <div>
          <p>❌ 未ログイン</p>
          <button onClick={handleLogin} style={{ padding: "8px 16px" }}>
            Googleログイン
          </button>
        </div>
      )}
    </div>
  );
}
