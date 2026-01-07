import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export async function GET(request, context) {
  try {
    const { params } = context;
    const resolvedParams = await params;

    if (!resolvedParams?.path || !Array.isArray(resolvedParams.path)) {
      return new NextResponse("Invalid path", { status: 400 });
    }

    // Cegah path traversal attack
    const safePath = path.normalize(
      path.join(UPLOAD_DIR, ...resolvedParams.path)
    );

    if (!safePath.startsWith(UPLOAD_DIR)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    if (!fs.existsSync(safePath)) {
      return new NextResponse("File not found", { status: 404 });
    }

    const fileBuffer = await fs.promises.readFile(safePath);

    // Content-Type whitelist (anti exploit)
    const ext = path.extname(safePath).toLowerCase();
    const contentTypeMap = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".webp": "image/webp",
      ".pdf": "application/pdf",
      ".docx":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };

    if (!contentTypeMap[ext]) {
      return new NextResponse("Unsupported file type", { status: 415 });
    }

    const contentType = contentTypeMap[ext];

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Security-Policy": "default-src 'none'",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("UPLOAD API ERROR:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
