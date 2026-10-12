import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { deliveryVerificationSchema } from "@/validations/delivery.schema";
import { verifyDelivery } from "@/services/delivery.service";
import { handleApiError } from "@/lib/errors";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const validated = deliveryVerificationSchema.parse(body);

    const result = await verifyDelivery(user, params.id, validated);
    return NextResponse.json({
      success: true,
      message: result.status === "DISPUTED" ? "Delivery dispute recorded." : "Receipt confirmed successfully.",
      data: result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}