import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navigation - Apple-style minimal */}
      <nav className="glass fixed top-0 left-0 right-0 z-50 border-b border-black/5">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-semibold tracking-tight">FD</span>
            </div>
            <span className="text-sm font-semibold text-foreground tracking-tight">Forest Dali</span>
          </div>
          <Link
            href="/interview/setup"
            className="text-sm font-medium text-primary hover:text-primary-dark"
          >
            面接を開始
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 pt-14">
        {/* Hero */}
        <section className="relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-surface via-white to-white" />
          <div className="absolute inset-0 bg-mesh" />

          {/* Floating letter animations */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
            {/* Letter 1 - top left */}
            <div className="absolute top-[18%] left-[8%] sm:left-[12%] animate-letter-pop" style={{ animationDelay: '0.5s' }}>
              <svg width="44" height="36" viewBox="0 0 44 36" fill="none" className="drop-shadow-md">
                <rect x="2" y="6" width="40" height="28" rx="4" fill="#e8f5e9" stroke="#2d6a4f" strokeWidth="1.5"/>
                <path d="M2 10l20 12L42 10" stroke="#2d6a4f" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="36" cy="4" r="4" fill="#ef4444"/>
              </svg>
            </div>
            {/* Letter 2 - top right */}
            <div className="absolute top-[14%] right-[6%] sm:right-[14%] animate-letter-pop" style={{ animationDelay: '1.0s' }}>
              <svg width="38" height="30" viewBox="0 0 38 30" fill="none" className="drop-shadow-md">
                <rect x="2" y="4" width="34" height="24" rx="3.5" fill="#f0fdf4" stroke="#40916c" strokeWidth="1.5"/>
                <path d="M2 8l17 10L36 8" stroke="#40916c" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            {/* Letter 3 - mid left */}
            <div className="absolute top-[45%] left-[3%] sm:left-[8%] animate-letter-pop" style={{ animationDelay: '1.5s' }}>
              <svg width="36" height="28" viewBox="0 0 36 28" fill="none" className="drop-shadow-sm">
                <rect x="2" y="4" width="32" height="22" rx="3" fill="#dcfce7" stroke="#1b4332" strokeWidth="1.2"/>
                <path d="M2 8l16 9L34 8" stroke="#1b4332" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="30" cy="3" r="3" fill="#ef4444"/>
              </svg>
            </div>
            {/* Letter 4 - mid right */}
            <div className="absolute top-[50%] right-[3%] sm:right-[10%] animate-letter-pop" style={{ animationDelay: '2.0s' }}>
              <svg width="42" height="34" viewBox="0 0 42 34" fill="none" className="drop-shadow-md">
                <rect x="2" y="5" width="38" height="27" rx="4" fill="#f0fdf4" stroke="#2d6a4f" strokeWidth="1.5"/>
                <path d="M2 9l19 11L40 9" stroke="#2d6a4f" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            {/* Letter 5 - bottom left (small) */}
            <div className="hidden sm:block absolute top-[68%] left-[15%] animate-letter-pop" style={{ animationDelay: '2.4s' }}>
              <svg width="30" height="24" viewBox="0 0 30 24" fill="none" className="drop-shadow-sm opacity-70">
                <rect x="2" y="4" width="26" height="18" rx="3" fill="#e8f5e9" stroke="#40916c" strokeWidth="1"/>
                <path d="M2 7l13 7L28 7" stroke="#40916c" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            {/* Letter 6 - bottom right (small) */}
            <div className="hidden sm:block absolute top-[72%] right-[18%] animate-letter-pop" style={{ animationDelay: '2.8s' }}>
              <svg width="28" height="22" viewBox="0 0 28 22" fill="none" className="drop-shadow-sm opacity-60">
                <rect x="2" y="3" width="24" height="17" rx="2.5" fill="#dcfce7" stroke="#1b4332" strokeWidth="1"/>
                <path d="M2 6l12 7L26 6" stroke="#1b4332" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            {/* Continuous drifting letters (subtle background) */}
            <div className="absolute top-[30%] left-[20%] animate-letter-drift" style={{ animationDelay: '1s' }}>
              <svg width="20" height="16" viewBox="0 0 20 16" fill="none" className="opacity-20">
                <rect x="1" y="3" width="18" height="12" rx="2" fill="#2d6a4f"/>
                <path d="M1 5l9 5 9-5" stroke="#fff" strokeWidth="1" fill="none"/>
              </svg>
            </div>
            <div className="absolute top-[25%] right-[25%] animate-letter-drift" style={{ animationDelay: '3s' }}>
              <svg width="18" height="14" viewBox="0 0 18 14" fill="none" className="opacity-15">
                <rect x="1" y="2" width="16" height="11" rx="2" fill="#40916c"/>
                <path d="M1 4l8 5 8-5" stroke="#fff" strokeWidth="1" fill="none"/>
              </svg>
            </div>
          </div>

          <div className="relative max-w-3xl mx-auto px-6 pt-20 pb-16 sm:pt-28 sm:pb-24 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 mb-8 animate-fade-in opacity-0">
              <div className="w-1.5 h-1.5 bg-primary rounded-full" />
              <span className="text-xs font-medium text-primary">AI Interview System</span>
            </div>

            {/* Main heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 animate-fade-in opacity-0 stagger-1" style={{ lineHeight: '1.1' }}>
              代表から直接オファーが届く！
              <br />
              <span className="text-primary">AI面談</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-foreground/50 max-w-lg mx-auto mb-12 animate-fade-in opacity-0 stagger-2" style={{ lineHeight: '1.7' }}>
              株式会社Forest DaliのAI面接システム。
              <br className="hidden sm:block" />
              リラックスして、ありのままのあなたをお聞かせください。
            </p>

            {/* CTA Button */}
            <div className="animate-fade-in opacity-0 stagger-3">
              <Link
                href="/interview/setup"
                className="group inline-flex items-center justify-center gap-2.5 bg-primary hover:bg-primary-dark text-white font-semibold py-4 px-10 rounded-full text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
              >
                面接を開始する
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>

            <p className="mt-5 text-xs text-foreground/30 animate-fade-in opacity-0 stagger-4">
              カメラとマイクの使用許可が必要です
            </p>
          </div>
        </section>

        {/* Flow Section */}
        <section className="py-16 sm:py-24 bg-white">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-14">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">面接の流れ</h2>
              <p className="text-foreground/40 text-sm">シンプルな3ステップで完了します</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
              {/* Step 1 */}
              <div className="group relative">
                <div className="bg-surface rounded-2xl p-8 h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  <div className="w-12 h-12 bg-primary/8 rounded-2xl flex items-center justify-center mb-5">
                    <span className="text-primary font-bold text-lg">1</span>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2 text-lg">面接タイプを選択</h3>
                  <p className="text-sm text-foreground/45 leading-relaxed">新卒・インターン・中途から該当する採用区分を選択します</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="group relative">
                <div className="bg-surface rounded-2xl p-8 h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  <div className="w-12 h-12 bg-primary/8 rounded-2xl flex items-center justify-center mb-5">
                    <span className="text-primary font-bold text-lg">2</span>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2 text-lg">AI面接を受ける</h3>
                  <p className="text-sm text-foreground/45 leading-relaxed">カメラONでAI面接官の質問に音声で回答します</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="group relative">
                <div className="bg-surface rounded-2xl p-8 h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  <div className="w-12 h-12 bg-primary/8 rounded-2xl flex items-center justify-center mb-5">
                    <span className="text-primary font-bold text-lg">3</span>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2 text-lg">面接完了</h3>
                  <p className="text-sm text-foreground/45 leading-relaxed">録画が保存され、採用担当者による審査に進みます</p>
                </div>
              </div>
            </div>
          </div>
        </section>
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
