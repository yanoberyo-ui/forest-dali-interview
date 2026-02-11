import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const interview = await prisma.interview.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!interview) {
      return NextResponse.json({ error: "面接が見つかりません" }, { status: 404 });
    }

    const firstMessage = interview.messages.find((m) => m.role === "assistant");

    return NextResponse.json({
      id: interview.id,
      candidateName: interview.candidateName,
      interviewType: interview.interviewType,
      status: interview.status,
      firstMessage: firstMessage?.content || "",
      messages: interview.messages.map((m) => ({
        role: m.role,
        content: m.content,
        questionNum: m.questionNum,
        createdAt: m.createdAt,
      })),
    });
  } catch (error) {
    console.error("Interview fetch error:", error);
    return NextResponse.json({ error: "エラーが発生しました" }, { status: 500 });
  }
}
