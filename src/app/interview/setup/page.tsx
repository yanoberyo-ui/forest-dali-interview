"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { INTERVIEW_TYPES, type InterviewType } from "@/lib/constants";

export default function InterviewSetup() {
  const router = useRouter();
  const [step, setStep] = useState<"type" | "info">("type");
  const [selectedType, setSelectedType] = useState<InterviewType | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || !name.trim() || !email.trim()) return;

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/interview/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateName: name.trim(),
          candidateEmail: email.trim(),
          interviewType: selectedType,
        }),
      });

      if (!res.ok) throw new Error("面接の作成に失敗しました");

      const data = await res.json();
      router.push(`/interview/session?id=${data.interviewId}`);
    } catch {
      setError("エラーが発生しました。もう一度お試しください。");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-white py-4 px-6 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-xl font-bold">
            FD
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wide">株式会社Forest Dali</h1>
            <p className="text-xs text-white/70">AI Interview System</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center bg-surface px-4 py-12">
        <div className="max-w-2xl w-full animate-fade-in">
          {step === "type" ? (
            <>
              <h2 className="text-2xl font-bold text-center mb-2">面接タイプを選択してください</h2>
              <p className="text-center text-foreground/50 mb-8">該当する採用区分をお選びください</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {(Object.keys(INTERVIEW_TYPES) as InterviewType[]).map((type) => {
                  const info = INTERVIEW_TYPES[type];
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`p-6 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                        selectedType === type
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-gray-200 bg-white hover:border-primary/30"
                      }`}
                    >
                      <div className="text-3xl mb-3">{info.icon}</div>
                      <h3 className="font-semibold text-lg mb-1">{info.label}</h3>
                      <p className="text-sm text-foreground/50">{info.description}</p>
                    </button>
                  );
                })}
              </div>

              <div className="text-center">
                <button
                  onClick={() => selectedType && setStep("info")}
                  disabled={!selectedType}
                  className="bg-primary hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-full transition-colors"
                >
                  次へ
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep("type")}
                className="flex items-center gap-1 text-primary hover:text-primary-dark mb-6 text-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                戻る
              </button>

              <h2 className="text-2xl font-bold text-center mb-8">お名前とメールアドレスを入力</h2>

              <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto">
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">お名前</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="山田 太郎"
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-1">メールアドレス</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="taro@example.com"
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>

                {error && (
                  <p className="text-error text-sm mb-4 text-center">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim() || !email.trim()}
                  className="w-full bg-primary hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-full transition-colors"
                >
                  {isSubmitting ? "準備中..." : "面接を開始する"}
                </button>

                <p className="text-xs text-foreground/40 text-center mt-4">
                  ※ 次の画面でカメラとマイクの許可を求められます
                </p>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
