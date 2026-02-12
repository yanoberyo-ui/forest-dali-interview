import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { INTERVIEW_TYPES, type InterviewType } from "@/lib/constants";
import { VideoPlayer } from "@/components/VideoPlayer";

export const dynamic = 'force-dynamic';

interface TraitData {
  score: number;
  comment: string;
}

interface Traits {
  values?: TraitData;
  teamwork?: TraitData;
  problemSolving?: TraitData;
  communication?: TraitData;
  stressHandling?: TraitData;
  creativity?: TraitData;
  growth?: TraitData;
}

const TRAIT_LABELS: Record<string, string> = {
  values: "価値観",
  teamwork: "チームワーク",
  problemSolving: "問題解決力",
  communication: "コミュニケーション",
  stressHandling: "ストレス対処",
  creativity: "創造性",
  growth: "成長意欲",
};

export default async function InterviewDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const interview = await prisma.interview.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      assessment: true,
    },
  });

  if (!interview) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>面接が見つかりません</p>
      </div>
    );
  }

  let traits: Traits = {};
  try {
    if (interview.assessment?.traits) {
      traits = JSON.parse(interview.assessment.traits);
    }
  } catch {}

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary-dark text-white py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-xl font-bold">
              FD
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-wide">面接詳細</h1>
              <p className="text-xs text-white/70">{interview.candidateName}</p>
            </div>
          </div>
          <Link href="/admin/dashboard" className="text-sm text-white/70 hover:text-white transition-colors">
            &larr; 一覧に戻る
          </Link>
        </div>
      </header>

      <main className="flex-1 bg-surface px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Candidate Info */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-foreground/50 mb-1">候補者名</p>
                <p className="font-semibold">{interview.candidateName}</p>
              </div>
              <div>
                <p className="text-xs text-foreground/50 mb-1">メール</p>
                <p className="text-sm">{interview.candidateEmail}</p>
              </div>
              <div>
                <p className="text-xs text-foreground/50 mb-1">面接タイプ</p>
                <span className="inline-block bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full">
                  {INTERVIEW_TYPES[interview.interviewType as InterviewType]?.label || interview.interviewType}
                </span>
              </div>
              <div>
                <p className="text-xs text-foreground/50 mb-1">実施日</p>
                <p className="text-sm">
                  {interview.completedAt
                    ? new Date(interview.completedAt).toLocaleDateString("ja-JP", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Video Player */}
            <div>
              <h3 className="text-lg font-semibold mb-3">面接動画</h3>
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                {interview.videoPath ? (
                  <VideoPlayer
                    src={`/api/video/serve?file=${encodeURIComponent(interview.videoPath.split('/').pop() || '')}`}
                  />
                ) : (
                  <div className="aspect-video bg-gray-100 flex items-center justify-center">
                    <p className="text-foreground/40">動画がありません</p>
                  </div>
                )}
              </div>
            </div>

            {/* Transcript */}
            <div>
              <h3 className="text-lg font-semibold mb-3">対話ログ</h3>
              <div className="bg-white rounded-2xl shadow-lg p-4 max-h-[500px] overflow-y-auto space-y-3">
                {interview.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-xl text-sm ${
                      msg.role === "assistant"
                        ? "bg-surface border-l-4 border-primary"
                        : "bg-primary/5 border-l-4 border-accent"
                    }`}
                  >
                    <p className="text-xs font-semibold text-foreground/50 mb-1">
                      {msg.role === "assistant" ? "AI面接官" : "候補者"}
                      {msg.questionNum && ` (質問${msg.questionNum})`}
                    </p>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Assessment */}
          {interview.assessment && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">AI評価レポート</h3>
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="mb-6">
                  <h4 className="font-medium text-sm text-foreground/50 mb-2">総合評価</h4>
                  <p className="text-foreground/80">{interview.assessment.summary}</p>
                </div>

                {Object.keys(traits).length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-foreground/50 mb-3">パーソナリティ特性</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(traits).map(([key, value]) => {
                        if (!value || typeof value !== "object") return null;
                        return (
                          <div key={key} className="bg-surface rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">{TRAIT_LABELS[key] || key}</span>
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <div
                                    key={star}
                                    className={`w-3 h-3 rounded-full ${
                                      star <= (value.score || 0) ? "bg-primary" : "bg-gray-200"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-xs text-foreground/60">{value.comment}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
