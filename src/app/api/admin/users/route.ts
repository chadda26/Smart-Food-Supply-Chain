import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    await requireRole("ADMIN");
    const users = await db.user.findMany({
      include: { foodProvider: true, ngo: true, distributor: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    return handleApiError(error);
  }
}