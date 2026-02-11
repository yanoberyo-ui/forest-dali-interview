import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { FIXED_QUESTIONS, type InterviewType } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const { candidateName, candidateEmail, interviewType } =
      await request.json();

    if (!candidateName || !candidateEmail || !interviewType) {
      return NextResponse.json(
        { error: "必須項目が不足しています" },
        { status: 400 }
      );
    }

    if (!["shinsotsu", "intern", "chuto"].includes(interviewType)) {
      return NextResponse.json(
        { error: "無効な面接タイプです" },
        { status: 400 }
      );
    }

    const questions = FIXED_QUESTIONS[interviewType as InterviewType];
    const firstMessage = questions[0];

    const interview = await prisma.interview.create({
      data: {
        candidateName,
        candidateEmail,
        interviewType,
        status: "in_progress",
      },
    });

    await prisma.chatMessage.create({
      data: {
        interviewId: interview.id,
        role: "assistant",
        content: firstMessage,
        questionNum: 1,
      },
    });

    return NextResponse.json({
      interviewId: interview.id,
      firstMessage,
    });
  } catch (error) {
    console.error("Interview creation error:", error);
    return NextResponse.json(
      { error: "面接の作成に失敗しました" },
      { status: 500 }
    );
  }
}
