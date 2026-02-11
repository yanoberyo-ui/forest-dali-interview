import Link from "next/link";

export default function InterviewComplete() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navigation */}
      <nav className="glass fixed top-0 left-0 right-0 z-50 border-b border-black/5">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-semibold tracking-tight">FD</span>
            </div>
            <span className="text-sm font-semibold text-foreground tracking-tight">Forest Dali</span>
          </Link>
        </div>
      </nav>

      <main className="flex-1 pt-14 flex items-center justify-center px-6">
        <div className="max-w-lg w-full text-center animate-fade-in py-16">
          {/* Success icon */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/8 rounded-[28px] mb-2 animate-scale-in">
              <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
          </div>

          {/* Main message */}
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            面接お疲れ様でした
          </h1>
          <p className="text-lg text-foreground/45 mb-12 leading-relaxed">
            面接を受けてくださり、ありがとうございます。
            <br />
            あなたのお話を聞かせていただけて嬉しかったです。
          </p>

          {/* Info card */}
          <div className="bg-surface rounded-2xl p-8 mb-12 text-left">
            <h2 className="text-sm font-semibold text-foreground mb-4">今後の流れ</h2>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-primary/8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                </div>
                <p className="text-sm text-foreground/60 leading-relaxed">
                  実際の面接官が今回の内容を確認いたします
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-primary/8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                </div>
                <p className="text-sm text-foreground/60 leading-relaxed">
                  該当の方には、スカウトや役員最終面談のご連絡をさせていただきます
                </p>
              </div>
            </div>
          </div>

          {/* Back link */}
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-sm font-medium text-foreground/35 hover:text-primary transition-colors"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            トップページに戻る
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 text-center border-t border-black/5">
        <p className="text-xs text-foreground/30">
          &copy; {new Date().getFullYear()} 株式会社Forest Dali. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
