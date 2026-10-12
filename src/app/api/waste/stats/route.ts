import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getWasteStats } from "@/services/waste.service";
import { handleApiError } from "@/lib/errors";

export async function GET() {
  try {
    const user = await requireAuth();
    const stats = await getWasteStats(user);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    return handleApiError(error);
  }
}