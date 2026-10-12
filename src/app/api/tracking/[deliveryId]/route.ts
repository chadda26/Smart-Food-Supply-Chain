import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getLiveDeliveryTracking } from "@/services/tracking.service";
import { handleApiError } from "@/lib/errors";

export async function GET(req: NextRequest, { params }: { params: { deliveryId: string } }) {
  try {
    const user = await requireAuth();
    const data = await getLiveDeliveryTracking(user, params.deliveryId);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleApiError(error);
  }
}