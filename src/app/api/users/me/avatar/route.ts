import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { promises as fs } from "fs";
import path from "path";
import { databaseManager } from "@/db/database-manager";

// POST /api/users/me/avatar
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { dataUrl } = body;
    if (
      !dataUrl ||
      typeof dataUrl !== "string" ||
      !dataUrl.startsWith("data:image")
    ) {
      return NextResponse.json(
        { error: "Invalid image data" },
        { status: 400 },
      );
    }

    // Decode base64 data URL
    const matches = dataUrl.match(/^data:(image\/(png|jpeg|jpg));base64,(.+)$/);
    if (!matches) {
      return NextResponse.json(
        { error: "Unsupported image format" },
        { status: 400 },
      );
    }

    const mime = matches[1];
    const ext = matches[2] === "jpeg" ? "jpg" : matches[2];
    const base64 = matches[3];
    const buffer = Buffer.from(base64, "base64");

    // Ensure uploads directory exists in public
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    // Write file
    const filename = `${session.user.id}.${ext}`;
    const filepath = path.join(uploadsDir, filename);
    await fs.writeFile(filepath, buffer);

    // Persist URL to DB
    const db = databaseManager.getService();
    if (!db.getPool) {
      return NextResponse.json(
        { error: "Database service not available" },
        { status: 500 },
      );
    }
    const pool = await db.getPool();
    const urlPath = `/uploads/${filename}`;

    await pool
      .request()
      .input("avatarUrl", urlPath)
      .input("userId", session.user.id)
      .query(
        "UPDATE users SET avatarUrl = @avatarUrl, updated_at = GETDATE() WHERE id = @userId",
      );

    return NextResponse.json({ success: true, avatarUrl: urlPath });
  } catch (error) {
    console.error("Upload avatar error:", error);
    return NextResponse.json(
      { error: "Failed to upload avatar" },
      { status: 500 },
    );
  }
}
