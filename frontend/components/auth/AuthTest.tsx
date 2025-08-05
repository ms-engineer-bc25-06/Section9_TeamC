"use client";

import { useAuth } from "@/hooks/useAuth";

export default function AuthTest() {
  const { user, loading, loginWithGoogle, logout, isAuthenticated } = useAuth();

  if (loading) {
    return <div>認証状態確認中...</div>;
  }

  return (
    <div style={{ padding: "20px", border: "1px solid #ccc", margin: "10px" }}>
      <h3>🔥 Firebase Auth Test</h3>

      {isAuthenticated ? (
        <div>
          <p>✅ ログイン済み</p>
          <p>ユーザー: {user?.displayName}</p>
          <p>Email: {user?.email}</p>
          <button onClick={logout}>ログアウト</button>
        </div>
      ) : (
        <div>
          <p>❌ 未ログイン</p>
          <button onClick={loginWithGoogle}>Googleログイン</button>
        </div>
      )}
    </div>
  );
}
