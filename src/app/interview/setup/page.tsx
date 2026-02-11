"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navigation */}
      <nav className="glass fixed top-0 left-0 right-0 z-50 border-b border-black/5">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-semibold tracking-tight">FD</span>
            </div>
            <span className="text-sm font-semibold text-foreground tracking-tight">Forest Dali</span>
          </Link>
          {/* Progress indicator */}
          <div className="flex items-center gap-2">
            <div className={`h-1 w-8 rounded-full transition-colors ${step === "type" ? "bg-primary" : "bg-primary"}`} />
            <div className={`h-1 w-8 rounded-full transition-colors ${step === "info" ? "bg-primary" : "bg-black/10"}`} />
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-14 flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full animate-fade-in">
          {step === "type" ? (
            <div className="text-center">
              {/* Header */}
              <div className="mb-10">
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
                  面接タイプを選択
                </h1>
                <p className="text-foreground/40">
                  該当する採用区分をお選びください
                </p>
              </div>

              {/* Type cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                {(Object.keys(INTERVIEW_TYPES) as InterviewType[]).map((type) => {
                  const info = INTERVIEW_TYPES[type];
                  const isSelected = selectedType === type;
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`group relative p-6 rounded-2xl text-left transition-all duration-300 ${
                        isSelected
                          ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]"
                          : "bg-surface hover:bg-surface-dark hover:shadow-md"
                      }`}
                    >
                      <div className={`text-3xl mb-4 ${isSelected ? "" : ""}`}>{info.icon}</div>
                      <h3 className={`font-semibold text-lg mb-1.5 ${isSelected ? "text-white" : "text-foreground"}`}>
                        {info.label}
                      </h3>
                      <p className={`text-sm leading-relaxed ${isSelected ? "text-white/70" : "text-foreground/45"}`}>
                        {info.description}
                      </p>
                      {/* Selection indicator */}
                      {isSelected && (
                        <div className="absolute top-4 right-4">
                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* CTA */}
              <button
                onClick={() => selectedType && setStep("info")}
                disabled={!selectedType}
                className="group inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold py-3.5 px-10 rounded-full transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
              >
                次へ進む
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="max-w-md mx-auto">
              {/* Back button */}
              <button
                onClick={() => setStep("type")}
                className="group flex items-center gap-1.5 text-foreground/40 hover:text-foreground mb-8 text-sm font-medium"
              >
                <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                戻る
              </button>

              {/* Header */}
              <div className="text-center mb-10">
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
                  お名前と連絡先
                </h1>
                <p className="text-foreground/40">
                  面接に必要な情報を入力してください
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-2">お名前</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="山田 太郎"
                    required
                    className="w-full px-4 py-3.5 bg-surface border-0 rounded-xl text-foreground placeholder:text-foreground/25 focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-2">メールアドレス</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="taro@example.com"
                    required
                    className="w-full px-4 py-3.5 bg-surface border-0 rounded-xl text-foreground placeholder:text-foreground/25 focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-error/5 border border-error/10 rounded-xl">
                    <svg className="w-4 h-4 text-error flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    <p className="text-error text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim() || !email.trim()}
                  className="w-full bg-primary hover:bg-primary-dark disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all duration-300 hover:shadow-lg mt-2"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      準備中...
                    </span>
                  ) : (
                    "面接を開始する"
                  )}
                </button>

                <p className="text-xs text-foreground/30 text-center pt-2">
                  次の画面でカメラとマイクの許可を求められます
                </p>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
