import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError, NotFoundError, ForbiddenError } from "@/lib/errors";
import { recordTraceability } from "@/services/audit.service";
import { sendNotification } from "@/services/notification.service";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole(["DISTRIBUTOR", "ADMIN"]);
    const delivery = await db.delivery.findUnique({
      where: { id: params.id },
      include: {
        distributor: true,
        donation: true,
        ngo: true,
      },
    });

    if (!delivery) throw new NotFoundError("Delivery not found");
    if (delivery.distributor.userId !== user.id && user.role !== "ADMIN") {
      throw new ForbiddenError("Unauthorized.");
    }

    const updated = await db.delivery.update({
      where: { id: params.id },
      data: { status: "IN_TRANSIT" },
    });

    await db.foodDonation.update({
      where: { id: delivery.donationId },
      data: { status: "IN_TRANSIT" },
    });

    await recordTraceability({
      donationId: delivery.donationId,
      stage: "IN_TRANSIT",
      actor: user.name,
      actorRole: "DISTRIBUTOR",
      action: "Delivery Transit Started with Live GPS",
      description: `Transit commenced heading towards ${delivery.ngo.organizationName}. Live tracking enabled.`,
    });

    await sendNotification(
      delivery.ngo.userId,
      "Food Is In Transit to Your Facility",
      `Driver ${user.name} is on the way with ${delivery.donation.foodName}. Track live on your dashboard.`,
      "INFO",
      `/ngo/deliveries/${delivery.id}/track`
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}