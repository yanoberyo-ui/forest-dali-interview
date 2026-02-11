import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { INTERVIEW_TYPES, type InterviewType } from "@/lib/constants";

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const interviews = await prisma.interview.findMany({
    where: { status: "completed" },
    orderBy: { completedAt: "desc" },
    include: { assessment: true },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary-dark text-white py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-xl font-bold">
              FD
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-wide">Forest Dali 管理画面</h1>
              <p className="text-xs text-white/70">採用担当者用ダッシュボード</p>
            </div>
          </div>
          <Link href="/" className="text-sm text-white/70 hover:text-white transition-colors">
            トップページへ
          </Link>
        </div>
      </header>

      <main className="flex-1 bg-surface px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">面接一覧</h2>
            <span className="text-sm text-foreground/50">{interviews.length}件の面接</span>
          </div>

          {interviews.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="text-4xl mb-4">📋</div>
              <p className="text-foreground/50">まだ完了した面接はありません</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface border-b">
                    <th className="text-left py-3 px-4 text-sm font-semibold">候補者</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold hidden sm:table-cell">メール</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold">タイプ</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold hidden md:table-cell">実施日</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold">動画</th>
                  </tr>
                </thead>
                <tbody>
                  {interviews.map((interview) => (
                    <tr key={interview.id} className="border-b last:border-0 hover:bg-surface/50 transition-colors">
                      <td className="py-3 px-4 font-medium">{interview.candidateName}</td>
                      <td className="py-3 px-4 text-sm text-foreground/60 hidden sm:table-cell">
                        {interview.candidateEmail}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full">
                          {INTERVIEW_TYPES[interview.interviewType as InterviewType]?.label || interview.interviewType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground/60 hidden md:table-cell">
                        {interview.completedAt
                          ? new Date(interview.completedAt).toLocaleDateString("ja-JP", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "-"}
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/admin/interviews/${interview.id}`}
                          className="inline-flex items-center gap-1 text-primary hover:text-primary-dark text-sm font-medium"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
                          </svg>
                          確認
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
