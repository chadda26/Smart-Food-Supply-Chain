import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const notifications = await db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 40,
    });
    const unreadCount = await db.notification.count({
      where: { userId: user.id, isRead: false },
    });

    return NextResponse.json({
      success: true,
      data: { notifications, unreadCount },
    });
  } catch (error) {
    return handleApiError(error);
  }
}