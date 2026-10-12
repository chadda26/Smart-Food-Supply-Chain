import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { locationUpdateSchema } from "@/validations/delivery.schema";
import { recordLocationUpdate } from "@/services/tracking.service";
import { handleApiError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(["DISTRIBUTOR", "ADMIN"]);
    const body = await req.json();
    const validated = locationUpdateSchema.parse(body);

    const update = await recordLocationUpdate(user, validated);
    return NextResponse.json({ success: true, data: update });
  } catch (error) {
    return handleApiError(error);
  }
}