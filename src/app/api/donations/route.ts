import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createDonationSchema } from "@/validations/donation.schema";
import { createDonation } from "@/services/donation.service";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const availableOnly = searchParams.get("available") === "true";

    const where: any = {};

    if (user.role === "FOOD_PROVIDER") {
      where.provider = { userId: user.id };
    } else if (availableOnly || user.role === "NGO") {
      where.status = { in: ["APPROVED", "REQUESTED"] };
      where.expiryTime = { gt: new Date() };
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (category && category !== "ALL") {
      where.foodCategory = category;
    }

    const donations = await db.foodDonation.findMany({
      where,
      include: {
        provider: true,
        requests: { include: { ngo: true } },
        delivery: { include: { distributor: { include: { user: true } }, ngo: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: donations });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const validated = createDonationSchema.parse(body);
    const donation = await createDonation(user, validated);

    return NextResponse.json(
      {
        success: true,
        message: validated.isDraft ? "Donation draft saved." : "Donation submitted for review.",
        data: donation,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}