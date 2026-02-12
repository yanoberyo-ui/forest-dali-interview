import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readdir, readFile, writeFile, mkdir, rm } from "fs/promises";
import path from "path";

const UPLOAD_DIR = process.env.VIDEO_UPLOAD_DIR
  ? path.resolve(process.env.VIDEO_UPLOAD_DIR)
  : path.join(process.cwd(), "public", "uploads", "videos");

const CHUNK_DIR = path.join(UPLOAD_DIR, "chunks");

export async function POST(request: Request) {
  try {
    const { interviewId } = await request.json();

    if (!interviewId) {
      return NextResponse.json({ error: "interviewIdが必要です" }, { status: 400 });
    }

    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
    });

    if (!interview) {
      return NextResponse.json({ error: "面接が見つかりません" }, { status: 404 });
    }

    const chunkDir = path.join(CHUNK_DIR, interviewId);

    // Read all chunks and concatenate
    let files: string[];
    try {
      files = await readdir(chunkDir);
    } catch {
      return NextResponse.json({ error: "チャンクが見つかりません" }, { status: 404 });
    }

    // Sort by chunk index (chunk_000000.webm, chunk_000001.webm, ...)
    files.sort();

    const buffers: Buffer[] = [];
    for (const file of files) {
      if (file.endsWith(".webm")) {
        const buf = await readFile(path.join(chunkDir, file));
        buffers.push(buf);
      }
    }

    if (buffers.length === 0) {
      return NextResponse.json({ error: "チャンクデータがありません" }, { status: 400 });
    }

    // Concatenate all chunks into single file
    const combined = Buffer.concat(buffers);
    await mkdir(UPLOAD_DIR, { recursive: true });

    const filename = `${interviewId}_${Date.now()}.webm`;
    const filepath = path.join(UPLOAD_DIR, filename);
    await writeFile(filepath, combined);

    const videoPath = `/uploads/videos/${filename}`;

    // Update database
    await prisma.interview.update({
      where: { id: interviewId },
      data: { videoPath },
    });

    // Clean up chunk directory
    try {
      await rm(chunkDir, { recursive: true, force: true });
    } catch (e) {
      console.warn("Failed to cleanup chunks:", e);
    }

    return NextResponse.json({ videoPath });
  } catch (error) {
    console.error("Finalize error:", error);
    return NextResponse.json({ error: "動画結合に失敗しました" }, { status: 500 });
  }
}
