import Link from "next/link";

export default function InterviewComplete() {
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

      <main className="flex-1 flex items-center justify-center bg-gradient-to-b from-surface to-white px-4">
        <div className="max-w-lg w-full text-center animate-fade-in py-12">
          {/* Illustration area - Celebration scene */}
          <div className="relative mb-8">
            {/* Confetti / decoration */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-64 h-32 pointer-events-none">
              <div className="absolute top-0 left-8 w-3 h-3 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: "0ms", animationDuration: "2s" }} />
              <div className="absolute top-2 right-12 w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: "300ms", animationDuration: "2.5s" }} />
              <div className="absolute top-4 left-16 w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "600ms", animationDuration: "1.8s" }} />
              <div className="absolute top-1 right-20 w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "150ms", animationDuration: "2.2s" }} />
              <div className="absolute top-6 left-24 w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "450ms", animationDuration: "2.8s" }} />
              <div className="absolute top-3 right-8 w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "750ms", animationDuration: "2.1s" }} />
            </div>

            {/* Main illustration */}
            <div className="inline-flex flex-col items-center">
              <div className="text-8xl mb-2">🎉</div>
              <div className="flex gap-3 text-4xl">
                <span className="animate-bounce" style={{ animationDelay: "0ms", animationDuration: "1.5s" }}>🌸</span>
                <span className="animate-bounce" style={{ animationDelay: "200ms", animationDuration: "1.5s" }}>✨</span>
                <span className="animate-bounce" style={{ animationDelay: "400ms", animationDuration: "1.5s" }}>🌸</span>
              </div>
            </div>
          </div>

          {/* Thank you message */}
          <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 border border-primary/10">
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              面接お疲れ様でした！
            </h2>
            <p className="text-lg text-foreground/70 leading-relaxed mb-2">
              面接を受けてくださり、<br />
              本当にありがとうございます！
            </p>
            <p className="text-foreground/50 leading-relaxed">
              あなたのお話を聞かせていただけて嬉しかったです。<br />
              素敵な未来を応援しています。
            </p>

            <div className="mt-6 pt-5 border-t border-gray-100 text-sm text-foreground/60 leading-relaxed text-left space-y-2">
              <p>・実際の面接官が今回受けていただいた内容を確認いたします。</p>
              <p>・該当の方には、スカウトや役員最終面談のご連絡をさせていただきます。</p>
            </div>
          </div>

          {/* Warm closing illustration */}
          <div className="flex justify-center gap-2 text-3xl mb-8">
            <span>🌿</span>
            <span>🌳</span>
            <span>🏡</span>
            <span>🌳</span>
            <span>🌿</span>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            トップページに戻る
          </Link>
        </div>
      </main>

      <footer className="bg-white border-t py-4 px-6 text-center text-sm text-foreground/40">
        &copy; {new Date().getFullYear()} 株式会社Forest Dali. All rights reserved.
      </footer>
    </div>
  );
}
