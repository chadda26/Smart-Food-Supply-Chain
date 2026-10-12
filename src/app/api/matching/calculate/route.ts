import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { calculateMatchesForDonation } from "@/services/matching.service";
import { handleApiError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const donationId = searchParams.get("donationId");

    if (!donationId) {
      return NextResponse.json({ success: false, error: { message: "donationId is required" } }, { status: 400 });
    }

    const matches = await calculateMatchesForDonation(donationId);
    return NextResponse.json({ success: true, data: matches });
  } catch (error) {
    return handleApiError(error);
  }
}