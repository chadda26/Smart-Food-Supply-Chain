import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { assignDistributorSchema } from "@/validations/delivery.schema";
import { assignDistributor } from "@/services/delivery.service";
import { handleApiError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireRole("ADMIN");
    const body = await req.json();
    const validated = assignDistributorSchema.parse(body);

    const delivery = await assignDistributor(admin, validated);
    return NextResponse.json({
      success: true,
      message: "Distributor assigned and delivery initiated successfully.",
      data: delivery,
    });
  } catch (error) {
    return handleApiError(error);
  }
}