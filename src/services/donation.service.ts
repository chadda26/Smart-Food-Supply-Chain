import { db } from "@/lib/db";
import { AppError, NotFoundError, ForbiddenError } from "@/lib/errors";
import { createAuditLog, recordTraceability } from "@/services/audit.service";
import { sendNotification, notifyAdmins } from "@/services/notification.service";
import { SessionUser } from "@/types";

export async function generateHumanReadableDonationId(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const count = await db.foodDonation.count();
  const seq = String(count + 1).padStart(4, "0");
  return `DON-${currentYear}-${seq}`;
}

export async function createDonation(
  user: SessionUser,
  data: {
    foodName: string;
    foodCategory: any;
    quantity: number;
    unit: any;
    preparationTime: string;
    expiryTime: string;
    dietaryFlags?: string | null;
    storageRequirements?: string | null;
    notes?: string | null;
    imageUrl?: string | null;
    isDraft?: boolean;
  }
) {
  if (user.role !== "FOOD_PROVIDER") {
    throw new ForbiddenError("Only Food Providers can create food donations.");
  }

  const provider = await db.foodProvider.findUnique({
    where: { userId: user.id },
  });

  if (!provider) {
    throw new NotFoundError("Provider profile not found.");
  }

  const humanReadableId = await generateHumanReadableDonationId();
  const initialStatus = data.isDraft ? "DRAFT" : "SUBMITTED";

  const donation = await db.foodDonation.create({
    data: {
      humanReadableId,
      providerId: provider.id,
      foodName: data.foodName,
      foodCategory: data.foodCategory,
      quantity: data.quantity,
      unit: data.unit,
      preparationTime: new Date(data.preparationTime),
      expiryTime: new Date(data.expiryTime),
      dietaryFlags: data.dietaryFlags,
      storageRequirements: data.storageRequirements,
      notes: data.notes,
      imageUrl: data.imageUrl,
      status: initialStatus,
    },
    include: {
      provider: true,
    },
  });

  await recordTraceability({
    donationId: donation.id,
    stage: initialStatus,
    actor: provider.organizationName,
    actorRole: "FOOD_PROVIDER",
    action: data.isDraft ? "Donation Draft Saved" : "Donation Created and Submitted",
    description: `${data.quantity} ${data.unit} of ${data.foodName} registered by ${provider.organizationName}`,
    location: `${provider.address}, ${provider.city}`,
    metadata: {
      category: data.foodCategory,
      expiryTime: data.expiryTime,
    },
  });

  await createAuditLog({
    userId: user.id,
    actorRole: user.role,
    action: data.isDraft ? "DONATION_DRAFT_CREATED" : "DONATION_SUBMITTED",
    entity: "FOOD_DONATION",
    entityId: donation.id,
    metadata: { humanReadableId, foodName: data.foodName, quantity: data.quantity },
  });

  if (!data.isDraft) {
    await notifyAdmins(
      "New Donation Submitted",
      `${provider.organizationName} submitted ${data.quantity} ${data.unit} of ${data.foodName} (${humanReadableId}) for approval.`,
      "ACTION_REQUIRED",
      `/admin/donations`
    );
  }

  return donation;
}

export async function submitDraftDonation(user: SessionUser, donationId: string) {
  const donation = await db.foodDonation.findUnique({
    where: { id: donationId },
    include: { provider: true },
  });

  if (!donation) throw new NotFoundError("Donation not found");
  if (donation.provider.userId !== user.id && user.role !== "ADMIN") {
    throw new ForbiddenError("You can only submit your own donation drafts.");
  }
  if (donation.status !== "DRAFT") {
    throw new AppError(`Cannot submit donation in status '${donation.status}'. Only DRAFT can be submitted.`);
  }

  const updated = await db.foodDonation.update({
    where: { id: donationId },
    data: { status: "SUBMITTED" },
    include: { provider: true },
  });

  await recordTraceability({
    donationId: donation.id,
    stage: "SUBMITTED",
    actor: donation.provider.organizationName,
    actorRole: "FOOD_PROVIDER",
    action: "Donation Submitted for Approval",
    description: `Draft ${donation.humanReadableId} submitted for administrative verification.`,
  });

  await createAuditLog({
    userId: user.id,
    actorRole: user.role,
    action: "DONATION_SUBMITTED",
    entity: "FOOD_DONATION",
    entityId: donation.id,
  });

  await notifyAdmins(
    "Donation Submitted",
    `${donation.provider.organizationName} submitted donation ${donation.humanReadableId}`,
    "ACTION_REQUIRED",
    `/admin/donations`
  );

  return updated;
}

export async function reviewDonation(
  user: SessionUser,
  donationId: string,
  action: "APPROVE" | "REJECT",
  rejectionReason?: string
) {
  if (user.role !== "ADMIN") {
    throw new ForbiddenError("Only Administrators can review donations.");
  }

  const donation = await db.foodDonation.findUnique({
    where: { id: donationId },
    include: { provider: { include: { user: true } } },
  });

  if (!donation) throw new NotFoundError("Donation not found.");
  if (donation.status !== "SUBMITTED") {
    throw new AppError(`Cannot review donation with status '${donation.status}'. Only SUBMITTED donations can be reviewed.`);
  }

  const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

  const updated = await db.foodDonation.update({
    where: { id: donationId },
    data: {
      status: newStatus,
      rejectionReason: action === "REJECT" ? rejectionReason : null,
    },
    include: { provider: true },
  });

  await recordTraceability({
    donationId: donation.id,
    stage: newStatus,
    actor: user.name,
    actorRole: "ADMIN",
    action: action === "APPROVE" ? "Donation Approved" : "Donation Rejected",
    description:
      action === "APPROVE"
        ? `Donation verified and made available for NGO matching.`
        : `Donation rejected. Reason: ${rejectionReason || "Criteria not met"}`,
  });

  await createAuditLog({
    userId: user.id,
    actorRole: "ADMIN",
    action: action === "APPROVE" ? "DONATION_APPROVED" : "DONATION_REJECTED",
    entity: "FOOD_DONATION",
    entityId: donation.id,
    metadata: { newStatus, rejectionReason },
  });

  // Notify Provider
  await sendNotification(
    donation.provider.userId,
    action === "APPROVE" ? "Donation Approved" : "Donation Rejected",
    action === "APPROVE"
      ? `Your donation ${donation.humanReadableId} (${donation.foodName}) has been approved and is now active.`
      : `Your donation ${donation.humanReadableId} was rejected. Reason: ${rejectionReason || "Not specified."}`,
    action === "APPROVE" ? "SUCCESS" : "WARNING",
    `/provider/donations/${donation.id}`
  );

  return updated;
}