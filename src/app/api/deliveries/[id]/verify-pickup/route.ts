import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { pickupVerificationSchema } from "@/validations/delivery.schema";
import { verifyPickup } from "@/services/delivery.service";
import { handleApiError } from "@/lib/errors";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const validated = pickupVerificationSchema.parse(body);

    const result = await verifyPickup(user, params.id, validated);
    return NextResponse.json({
      success: true,
      message: "Pickup successfully verified and recorded.",
      data: result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}