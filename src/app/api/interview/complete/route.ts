import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAnthropic } from "@/lib/claude";
import { ASSESSMENT_PROMPT } from "@/utils/prompts";

export async function POST(request: Request) {
  try {
    const { interviewId } = await request.json();

    if (!interviewId) {
      return NextResponse.json({ error: "面接IDが必要です" }, { status: 400 });
    }

    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    if (!interview) {
      return NextResponse.json({ error: "面接が見つかりません" }, { status: 404 });
    }

    await prisma.interview.update({
      where: { id: interviewId },
      data: {
        status: "completed",
        completedAt: new Date(),
      },
    });

    const transcript = interview.messages
      .map((m) => `${m.role === "assistant" ? "AI面接官" : "候補者"}: ${m.content}`)
      .join("\n\n");

    // Skip if assessment already exists
    const existingAssessment = await prisma.assessment.findUnique({
      where: { interviewId },
    });

    if (!existingAssessment) {
      try {
        const response = await getAnthropic().messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2048,
          messages: [
            {
              role: "user",
              content: `${ASSESSMENT_PROMPT}\n\n--- 面接記録 ---\n${transcript}`,
            },
          ],
        });

        const assessmentText = response.content[0].type === "text" ? response.content[0].text : "";

        let summary = "";
        let traits = "{}";

        try {
          // Strip markdown code block wrapper if present
          const jsonStr = assessmentText.replace(/^```json?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
          const parsed = JSON.parse(jsonStr);
          summary = parsed.summary || "";
          traits = JSON.stringify(parsed.traits || {});
        } catch {
          summary = assessmentText;
          traits = "{}";
        }

        await prisma.assessment.create({
          data: {
            interviewId,
            summary,
            traits,
          },
        });
      } catch (assessError) {
        console.error("Assessment generation error:", assessError);
        await prisma.assessment.create({
          data: {
            interviewId,
            summary: "評価の自動生成に失敗しました。動画を確認してください。",
            traits: "{}",
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Complete error:", error);
    return NextResponse.json({ error: "面接の完了処理に失敗しました" }, { status: 500 });
  }
}
