import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createRequestSchema } from "@/validations/request.schema";
import { db } from "@/lib/db";
import { handleApiError, NotFoundError, AppError, ForbiddenError } from "@/lib/errors";
import { recordTraceability, createAuditLog } from "@/services/audit.service";
import { sendNotification, notifyAdmins } from "@/services/notification.service";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const where: any = {};

    if (user.role === "NGO") {
      where.ngo = { userId: user.id };
    } else if (user.role === "FOOD_PROVIDER") {
      where.donation = { provider: { userId: user.id } };
    }

    const requests = await db.donationRequest.findMany({
      where,
      include: {
        donation: { include: { provider: true } },
        ngo: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: requests });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role !== "NGO") {
      throw new ForbiddenError("Only registered NGOs can request food allocations.");
    }

    const ngo = await db.ngo.findUnique({ where: { userId: user.id } });
    if (!ngo) throw new NotFoundError("NGO profile not found.");

    const body = await req.json();
    const validated = createRequestSchema.parse(body);

    const donation = await db.foodDonation.findUnique({
      where: { id: validated.donationId },
      include: { provider: true },
    });

    if (!donation) throw new NotFoundError("Donation not found.");
    if (!["APPROVED", "REQUESTED"].includes(donation.status)) {
      throw new AppError("This donation is not currently available for requests.");
    }
    if (validated.requestedQuantity > donation.quantity) {
      throw new AppError(`Cannot request ${validated.requestedQuantity} ${donation.unit}. Available: ${donation.quantity} ${donation.unit}.`);
    }

    const request = await db.donationRequest.create({
      data: {
        donationId: validated.donationId,
        ngoId: ngo.id,
        requestedQuantity: validated.requestedQuantity,
        requestReason: validated.requestReason,
        status: "PENDING",
      },
      include: { donation: true, ngo: true },
    });

    // Mark donation status as REQUESTED if still APPROVED
    if (donation.status === "APPROVED") {
      await db.foodDonation.update({
        where: { id: donation.id },
        data: { status: "REQUESTED" },
      });
    }

    await recordTraceability({
      donationId: donation.id,
      stage: "REQUESTED",
      actor: ngo.organizationName,
      actorRole: "NGO",
      action: "Food Allocation Requested",
      description: `${ngo.organizationName} requested ${validated.requestedQuantity} ${donation.unit}. Reason: ${validated.requestReason}`,
    });

    await createAuditLog({
      userId: user.id,
      actorRole: "NGO",
      action: "FOOD_REQUEST_CREATED",
      entity: "DONATION_REQUEST",
      entityId: request.id,
    });

    await notifyAdmins(
      "New Food Allocation Request",
      `${ngo.organizationName} requested ${validated.requestedQuantity} ${donation.unit} of ${donation.foodName}`,
      "ACTION_REQUIRED",
      `/admin/requests`
    );

    await sendNotification(
      donation.provider.userId,
      "NGO Requested Food",
      `${ngo.organizationName} has requested food from your donation ${donation.humanReadableId}.`,
      "INFO",
      `/provider/donations/${donation.id}`
    );

    return NextResponse.json({
      success: true,
      message: "Food request submitted successfully.",
      data: request,
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}