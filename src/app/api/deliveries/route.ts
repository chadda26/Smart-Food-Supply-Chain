import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: any = {};

    if (user.role === "DISTRIBUTOR") {
      where.distributor = { userId: user.id };
    } else if (user.role === "FOOD_PROVIDER") {
      where.providerId = user.organizationId;
    } else if (user.role === "NGO") {
      where.ngoId = user.organizationId;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    const deliveries = await db.delivery.findMany({
      where,
      include: {
        donation: { include: { provider: true } },
        distributor: { include: { user: true } },
        ngo: true,
        pickupVerification: true,
        deliveryVerification: true,
        feedback: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: deliveries });
  } catch (error) {
    return handleApiError(error);
  }
}