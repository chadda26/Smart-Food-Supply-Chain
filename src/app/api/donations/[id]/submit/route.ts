import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { submitDraftDonation } from "@/services/donation.service";
import { handleApiError } from "@/lib/errors";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    const updated = await submitDraftDonation(user, params.id);
    return NextResponse.json({
      success: true,
      message: "Donation submitted for verification.",
      data: updated,
    });
  } catch (error) {
    return handleApiError(error);
  }
}