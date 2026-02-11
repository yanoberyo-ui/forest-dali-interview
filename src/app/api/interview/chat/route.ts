import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  FIXED_QUESTIONS,
  INTERVIEW_END_MESSAGE,
  MAX_QUESTIONS,
  type InterviewType,
} from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const { interviewId, userMessage } = await request.json();

    if (!interviewId || !userMessage) {
      return NextResponse.json(
        { error: "必須項目が不足しています" },
        { status: 400 }
      );
    }

    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    if (!interview) {
      return NextResponse.json(
        { error: "面接データが見つかりません" },
        { status: 404 }
      );
    }

    const interviewType = interview.interviewType as InterviewType;
    const questions = FIXED_QUESTIONS[interviewType];

    // Count how many assistant messages exist = how many questions have been asked so far
    const assistantCount = interview.messages.filter(
      (m) => m.role === "assistant"
    ).length;

    // The next question index (0-based). assistantCount already includes the first question.
    const nextQuestionIndex = assistantCount; // e.g. if 1 question asked, next is index 1

    // Determine the next response
    let nextMessage: string;
    let isComplete = false;

    if (nextQuestionIndex < questions.length) {
      // Still have questions to ask
      nextMessage = questions[nextQuestionIndex];
    } else {
      // All questions asked - send closing message
      nextMessage = INTERVIEW_END_MESSAGE;
      isComplete = true;
    }

    const questionNum = Math.min(nextQuestionIndex + 1, MAX_QUESTIONS);

    // Save user message + next question atomically
    await prisma.$transaction([
      prisma.chatMessage.create({
        data: {
          interviewId,
          role: "user",
          content: userMessage.trim(),
        },
      }),
      prisma.chatMessage.create({
        data: {
          interviewId,
          role: "assistant",
          content: nextMessage,
          questionNum,
        },
      }),
    ]);

    return NextResponse.json({
      message: nextMessage,
      questionNum,
      isComplete,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "予期しないエラーが発生しました" },
      { status: 500 }
    );
  }
}
