import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { handleApiError, AppError } from "@/lib/errors";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      throw new AppError("No image file provided in upload request.");
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      throw new AppError(`Invalid file type: ${file.type}. Allowed formats: JPEG, PNG, WEBP.`);
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new AppError(`File size exceeds 10MB limit (size: ${(file.size / 1024 / 1024).toFixed(1)}MB).`);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine extension
    let ext = "jpg";
    if (file.type.includes("png")) ext = "png";
    else if (file.type.includes("webp")) ext = "webp";
    else if (file.type.includes("jpeg") || file.type.includes("jpg")) ext = "jpg";

    const fileName = `pickup_${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "verifications");

    await fs.mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, buffer);

    const relativeUrl = `/uploads/verifications/${fileName}`;

    return NextResponse.json({
      success: true,
      message: "Photo uploaded successfully",
      data: {
        url: relativeUrl,
        fileName,
        size: file.size,
        mimeType: file.type,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}