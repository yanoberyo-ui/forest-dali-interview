import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// 動画保存先: 環境変数で指定可能。デフォルトはプロジェクトルートの public/uploads/videos
const UPLOAD_DIR = process.env.VIDEO_UPLOAD_DIR
  ? path.resolve(process.env.VIDEO_UPLOAD_DIR)
  : path.join(process.cwd(), "public", "uploads", "videos");

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const video = formData.get("video") as File | null;
    const interviewId = formData.get("interviewId") as string | null;

    if (!video || !interviewId) {
      return NextResponse.json({ error: "動画とinterviewIdが必要です" }, { status: 400 });
    }

    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
    });

    if (!interview) {
      return NextResponse.json({ error: "面接が見つかりません" }, { status: 404 });
    }

    await mkdir(UPLOAD_DIR, { recursive: true });

    const ext = video.type.includes("mp4") ? "mp4" : "webm";
    const filename = `${interviewId}_${Date.now()}.${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    const buffer = Buffer.from(await video.arrayBuffer());
    await writeFile(filepath, buffer);

    const videoPath = `/uploads/videos/${filename}`;

    await prisma.interview.update({
      where: { id: interviewId },
      data: { videoPath },
    });

    return NextResponse.json({ videoPath });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "アップロードに失敗しました" }, { status: 500 });
  }
}
