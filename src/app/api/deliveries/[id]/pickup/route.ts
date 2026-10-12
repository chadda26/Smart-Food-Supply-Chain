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
        donation: { include: { provider: true } },
        ngo: true,
      },
    });

    if (!delivery) throw new NotFoundError("Delivery not found");
    if (delivery.distributor.userId !== user.id && user.role !== "ADMIN") {
      throw new ForbiddenError("Not authorized to start this pickup.");
    }

    const updated = await db.delivery.update({
      where: { id: params.id },
      data: { status: "PICKUP_IN_PROGRESS" },
    });

    await db.foodDonation.update({
      where: { id: delivery.donationId },
      data: { status: "PICKUP_IN_PROGRESS" },
    });

    await recordTraceability({
      donationId: delivery.donationId,
      stage: "PICKUP_IN_PROGRESS",
      actor: user.name,
      actorRole: "DISTRIBUTOR",
      action: "Driver En Route to Pickup Location",
      description: `${user.name} is travelling to ${delivery.donation.provider.organizationName} for collection.`,
    });

    await sendNotification(
      delivery.donation.provider.userId,
      "Driver Approaching for Pickup",
      `${user.name} is on the way to pick up donation ${delivery.donation.humanReadableId}.`,
      "INFO",
      `/provider/deliveries/${delivery.id}/track`
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}