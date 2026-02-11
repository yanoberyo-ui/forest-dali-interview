import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
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

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center bg-surface px-4">
        <div className="max-w-2xl w-full text-center animate-fade-in">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6">
              <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              AI面接へようこそ
            </h2>
            <p className="text-lg text-foreground/60 mb-2">
              株式会社Forest DaliのAI面接システムです。
            </p>
            <p className="text-foreground/50">
              あなたのパーソナリティを知るための面接を行います。<br />
              リラックスして、ありのままのあなたをお聞かせください。
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h3 className="text-lg font-semibold mb-4 text-foreground">面接の流れ</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="flex flex-col items-center gap-2 p-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">1</div>
                <p className="font-medium">面接タイプを選択</p>
                <p className="text-foreground/50">新卒・インターン・中途から選択</p>
              </div>
              <div className="flex flex-col items-center gap-2 p-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">2</div>
                <p className="font-medium">AI面接を受ける</p>
                <p className="text-foreground/50">カメラONでAIの質問に答えます</p>
              </div>
              <div className="flex flex-col items-center gap-2 p-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">3</div>
                <p className="font-medium">面接完了</p>
                <p className="text-foreground/50">録画が保存され審査に進みます</p>
              </div>
            </div>
          </div>

          <Link
            href="/interview/setup"
            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold py-4 px-10 rounded-full text-lg transition-colors shadow-lg hover:shadow-xl"
          >
            面接を開始する
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>

          <p className="mt-6 text-sm text-foreground/40">
            ※ カメラとマイクの使用許可が必要です
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-4 px-6 text-center text-sm text-foreground/40">
        &copy; {new Date().getFullYear()} 株式会社Forest Dali. All rights reserved.
      </footer>
    </div>
  );
}
