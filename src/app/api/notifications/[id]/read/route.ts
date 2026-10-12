import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/errors";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    if (params.id === "all") {
      await db.notification.updateMany({
        where: { userId: user.id },
        data: { isRead: true },
      });
    } else {
      await db.notification.update({
        where: { id: params.id, userId: user.id },
        data: { isRead: true },
      });
    }
    return NextResponse.json({ success: true, message: "Marked as read." });
  } catch (error) {
    return handleApiError(error);
  }
}