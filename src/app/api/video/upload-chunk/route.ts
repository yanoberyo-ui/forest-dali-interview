import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// チャンク一時保存先
const CHUNK_DIR = process.env.VIDEO_UPLOAD_DIR
  ? path.resolve(process.env.VIDEO_UPLOAD_DIR, "chunks")
  : path.join(process.cwd(), "public", "uploads", "videos", "chunks");

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const chunk = formData.get("chunk") as File | null;
    const interviewId = formData.get("interviewId") as string | null;
    const chunkIndex = formData.get("chunkIndex") as string | null;

    if (!chunk || !interviewId || chunkIndex === null) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Save chunk to temp directory: chunks/{interviewId}/chunk_000.webm
    const chunkDir = path.join(CHUNK_DIR, interviewId);
    await mkdir(chunkDir, { recursive: true });

    const filename = `chunk_${chunkIndex.padStart(6, "0")}.webm`;
    const filepath = path.join(chunkDir, filename);

    const buffer = Buffer.from(await chunk.arrayBuffer());
    await writeFile(filepath, buffer);

    return NextResponse.json({ ok: true, chunkIndex });
  } catch (error) {
    console.error("Chunk upload error:", error);
    return NextResponse.json({ error: "チャンクアップロード失敗" }, { status: 500 });
  }
}
