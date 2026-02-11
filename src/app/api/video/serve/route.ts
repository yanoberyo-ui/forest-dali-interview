import { NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";

const UPLOAD_DIR = process.env.VIDEO_UPLOAD_DIR
  ? path.resolve(process.env.VIDEO_UPLOAD_DIR)
  : path.join(process.cwd(), "public", "uploads", "videos");

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("file");

    if (!filename) {
      return NextResponse.json({ error: "ファイル名が必要です" }, { status: 400 });
    }

    // パス走査攻撃を防止
    const safeName = path.basename(filename);
    const filepath = path.join(UPLOAD_DIR, safeName);

    try {
      await stat(filepath);
    } catch {
      return NextResponse.json({ error: "ファイルが見つかりません" }, { status: 404 });
    }

    const buffer = await readFile(filepath);
    const ext = path.extname(safeName).toLowerCase();
    const contentType = ext === ".mp4" ? "video/mp4" : "video/webm";

    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Video serve error:", error);
    return NextResponse.json({ error: "動画の取得に失敗しました" }, { status: 500 });
  }
}
