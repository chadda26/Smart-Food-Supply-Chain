import { db } from "@/lib/db";
import { AppError, NotFoundError, ForbiddenError } from "@/lib/errors";
import { createAuditLog, recordTraceability } from "@/services/audit.service";
import { sendNotification } from "@/services/notification.service";
import { SessionUser } from "@/types";

export async function assignDistributor(
  adminUser: SessionUser,
  params: {
    donationId: string;
    ngoId: string;
    distributorId: string;
    pickupEtaMinutes?: number;
  }
) {
  if (adminUser.role !== "ADMIN") {
    throw new ForbiddenError("Only administrators can assign distributors.");
  }

  const donation = await db.foodDonation.findUnique({
    where: { id: params.donationId },
    include: { provider: true },
  });
  if (!donation) throw new NotFoundError("Donation not found.");

  const distributor = await db.distributor.findUnique({
    where: { id: params.distributorId },
    include: { user: true },
  });
  if (!distributor) throw new NotFoundError("Distributor not found.");

  const ngo = await db.ngo.findUnique({
    where: { id: params.ngoId },
    include: { user: true },
  });
  if (!ngo) throw new NotFoundError("NGO not found.");

  const pickupEta = new Date(Date.now() + (params.pickupEtaMinutes || 30) * 60 * 1000);
  const deliveryEta = new Date(pickupEta.getTime() + 45 * 60 * 1000);

  const result = await db.$transaction(async (tx) => {
    // 1. Create or update Delivery
    const delivery = await tx.delivery.upsert({
      where: { donationId: params.donationId },
      create: {
        donationId: params.donationId,
        distributorId: params.distributorId,
        ngoId: params.ngoId,
        providerId: donation.providerId,
        status: "ASSIGNED",
        pickupEta,
        deliveryEta,
      },
      update: {
        distributorId: params.distributorId,
        ngoId: params.ngoId,
        status: "ASSIGNED",
        pickupEta,
        deliveryEta,
      },
      include: {
        donation: true,
        distributor: { include: { user: true } },
        ngo: true,
      },
    });

    // 2. Update donation status
    await tx.foodDonation.update({
      where: { id: params.donationId },
      data: { status: "ASSIGNED" },
    });

    // 3. Mark distributor as busy
    await tx.distributor.update({
      where: { id: params.distributorId },
      data: { availabilityStatus: "BUSY" },
    });

    return delivery;
  });

  await recordTraceability({
    donationId: donation.id,
    stage: "ASSIGNED",
    actor: adminUser.name,
    actorRole: "ADMIN",
    action: "Distributor Assigned",
    description: `Task assigned to ${distributor.user.name} for delivery to ${ngo.organizationName}. ETA: ${pickupEta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
  });

  await createAuditLog({
    userId: adminUser.id,
    actorRole: "ADMIN",
    action: "DISTRIBUTOR_ASSIGNED",
    entity: "DELIVERY",
    entityId: result.id,
    metadata: {
      distributorName: distributor.user.name,
      ngoName: ngo.organizationName,
    },
  });

  // Notify Distributor
  await sendNotification(
    distributor.userId,
    "New Pickup Task Assigned",
    `You have been assigned to pick up ${donation.quantity} ${donation.unit} of ${donation.foodName} from ${donation.provider.organizationName}.`,
    "ACTION_REQUIRED",
    `/distributor/deliveries/${result.id}`
  );

  // Notify Provider
  await sendNotification(
    donation.provider.userId,
    "Distributor Assigned",
    `Distributor ${distributor.user.name} has been assigned for pickup of ${donation.foodName}.`,
    "INFO",
    `/provider/deliveries/${result.id}/track`
  );

  // Notify NGO
  await sendNotification(
    ngo.userId,
    "Food Allocation Confirmed",
    `Donation ${donation.humanReadableId} is assigned to driver ${distributor.user.name} and will be delivered soon.`,
    "SUCCESS",
    `/ngo/deliveries/${result.id}/track`
  );

  return result;
}

export async function verifyPickup(
  user: SessionUser,
  deliveryId: string,
  data: {
    verificationCode: string;
    packageCondition: any;
    temperatureCheck?: string | null;
    photoUrl?: string | null;
    notes?: string | null;
  }
) {
  const delivery = await db.delivery.findUnique({
    where: { id: deliveryId },
    include: {
      distributor: true,
      donation: { include: { provider: true } },
      ngo: true,
    },
  });

  if (!delivery) throw new NotFoundError("Delivery task not found.");
  if (delivery.distributor.userId !== user.id && user.role !== "ADMIN") {
    throw new ForbiddenError("Only the assigned distributor can verify this pickup.");
  }

  await db.$transaction(async (tx) => {
    await tx.pickupVerification.upsert({
      where: { deliveryId },
      create: {
        deliveryId,
        verifiedByUserId: user.id,
        verificationCode: data.verificationCode,
        packageCondition: data.packageCondition,
        temperatureCheck: data.temperatureCheck,
        photoUrl: data.photoUrl,
        notes: data.notes,
      },
      update: {
        verifiedByUserId: user.id,
        verificationCode: data.verificationCode,
        packageCondition: data.packageCondition,
        temperatureCheck: data.temperatureCheck,
        photoUrl: data.photoUrl,
        notes: data.notes,
      },
    });

    await tx.delivery.update({
      where: { id: deliveryId },
      data: {
        status: "PICKED_UP",
        startedAt: new Date(),
      },
    });

    await tx.foodDonation.update({
      where: { id: delivery.donationId },
      data: { status: "PICKED_UP" },
    });
  });

  await recordTraceability({
    donationId: delivery.donationId,
    stage: "PICKED_UP",
    actor: user.name,
    actorRole: "DISTRIBUTOR",
    action: "Pickup Verified & Loaded",
    description: `Pickup completed at ${delivery.donation.provider.organizationName}. Package condition: ${data.packageCondition}. Temperature: ${data.temperatureCheck || "Standard"}`,
  });

  await createAuditLog({
    userId: user.id,
    actorRole: "DISTRIBUTOR",
    action: "PICKUP_VERIFIED",
    entity: "DELIVERY",
    entityId: deliveryId,
    metadata: { condition: data.packageCondition },
  });

  // Notify NGO
  await sendNotification(
    delivery.ngo.userId,
    "Driver Picked Up Food",
    `Your delivery of ${delivery.donation.foodName} has been picked up and will be in transit shortly.`,
    "INFO",
    `/ngo/deliveries/${delivery.id}/track`
  );

  return { success: true };
}

export async function verifyDelivery(
  user: SessionUser,
  deliveryId: string,
  data: {
    receivedQuantity: number;
    conditionStatus: any;
    status: any;
    disputeReason?: string | null;
    notes?: string | null;
  }
) {
  const delivery = await db.delivery.findUnique({
    where: { id: deliveryId },
    include: {
      ngo: true,
      distributor: { include: { user: true } },
      donation: { include: { provider: true } },
    },
  });

  if (!delivery) throw new NotFoundError("Delivery not found");
  if (delivery.ngo.userId !== user.id && user.role !== "ADMIN") {
    throw new ForbiddenError("Only the receiving NGO or Admin can confirm delivery.");
  }

  const isDispute = data.status === "DISPUTED" || data.conditionStatus === "REJECTED";
  const finalDeliveryStatus = isDispute ? "DISPUTED" : "COMPLETED";
  const finalDonationStatus = isDispute ? "CANCELLED" : "COMPLETED";

  await db.$transaction(async (tx) => {
    await tx.deliveryVerification.upsert({
      where: { deliveryId },
      create: {
        deliveryId,
        confirmedByUserId: user.id,
        receivedQuantity: data.receivedQuantity,
        conditionStatus: data.conditionStatus,
        status: data.status,
        disputeReason: data.disputeReason,
        notes: data.notes,
      },
      update: {
        confirmedByUserId: user.id,
        receivedQuantity: data.receivedQuantity,
        conditionStatus: data.conditionStatus,
        status: data.status,
        disputeReason: data.disputeReason,
        notes: data.notes,
      },
    });

    await tx.delivery.update({
      where: { id: deliveryId },
      data: {
        status: finalDeliveryStatus,
        completedAt: new Date(),
      },
    });

    await tx.foodDonation.update({
      where: { id: delivery.donationId },
      data: { status: finalDonationStatus },
    });

    // Update Distributor stats & availability
    await tx.distributor.update({
      where: { id: delivery.distributorId },
      data: {
        availabilityStatus: "AVAILABLE",
        totalDeliveries: { increment: isDispute ? 0 : 1 },
      },
    });
  });

  await recordTraceability({
    donationId: delivery.donationId,
    stage: finalDeliveryStatus,
    actor: delivery.ngo.organizationName,
    actorRole: "NGO",
    action: isDispute ? "Delivery Disputed / Exception Logged" : "Delivery Confirmed & Received",
    description: isDispute
      ? `Issue reported: ${data.disputeReason || "Condition unacceptable"}`
      : `Received ${data.receivedQuantity} ${delivery.donation.unit} in ${data.conditionStatus} condition by ${delivery.ngo.organizationName}.`,
  });

  await createAuditLog({
    userId: user.id,
    actorRole: "NGO",
    action: isDispute ? "DELIVERY_DISPUTED" : "DELIVERY_CONFIRMED",
    entity: "DELIVERY",
    entityId: deliveryId,
    metadata: {
      receivedQuantity: data.receivedQuantity,
      conditionStatus: data.conditionStatus,
      disputeReason: data.disputeReason,
    },
  });

  // Notify Provider & Distributor
  await sendNotification(
    delivery.donation.provider.userId,
    isDispute ? "Delivery Issue Reported" : "Donation Successfully Delivered!",
    isDispute
      ? `A dispute was recorded for donation ${delivery.donation.humanReadableId}: ${data.disputeReason}`
      : `Your donation of ${delivery.donation.foodName} has reached ${delivery.ngo.organizationName} successfully!`,
    isDispute ? "WARNING" : "SUCCESS",
    `/provider/donations/${delivery.donation.id}`
  );

  await sendNotification(
    delivery.distributor.userId,
    isDispute ? "Delivery Dispute Noted" : "Delivery Completed & Verified",
    isDispute
      ? `A dispute was logged for delivery ${delivery.donation.humanReadableId}. Admin will review.`
      : `Great job! Your delivery to ${delivery.ngo.organizationName} was verified and confirmed.`,
    isDispute ? "WARNING" : "SUCCESS",
    `/distributor/history`
  );

  return { success: true, status: finalDeliveryStatus };
}