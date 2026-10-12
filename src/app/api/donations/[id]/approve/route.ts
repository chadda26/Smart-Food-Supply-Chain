import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { approveDonationSchema } from "@/validations/donation.schema";
import { reviewDonation } from "@/services/donation.service";
import { handleApiError } from "@/lib/errors";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireRole("ADMIN");
    const body = await req.json();
    const validated = approveDonationSchema.parse(body);
    const updated = await reviewDonation(admin, params.id, validated.action, validated.rejectionReason);

    return NextResponse.json({
      success: true,
      message: validated.action === "APPROVE" ? "Donation approved." : "Donation rejected.",
      data: updated,
    });
  } catch (error) {
    return handleApiError(error);
  }
}