import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    await requireRole("ADMIN");
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const action = searchParams.get("action");

    const where: any = {};
    if (action && action !== "ALL") where.action = action;

    const logs = await db.auditLog.findMany({
      where,
      include: { user: { select: { name: true, email: true, role: true } } },
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    return handleApiError(error);
  }
}