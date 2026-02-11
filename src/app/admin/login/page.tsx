"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("メールアドレスまたはパスワードが正しくありません");
      setIsLoading(false);
    } else {
      router.push("/admin/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary-dark text-white py-4 px-6">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-xl font-bold">
            FD
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wide">Forest Dali 管理画面</h1>
            <p className="text-xs text-white/70">採用担当者専用</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center bg-surface px-4">
        <div className="w-full max-w-sm animate-fade-in">
          <h2 className="text-2xl font-bold text-center mb-6">ログイン</h2>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">メールアドレス</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">パスワード</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            {error && <p className="text-error text-sm mb-4 text-center">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-dark hover:bg-primary disabled:opacity-50 text-white font-semibold py-3 rounded-full transition-colors"
            >
              {isLoading ? "ログイン中..." : "ログイン"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
