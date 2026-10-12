import { db } from "@/lib/db";
import { CreateWasteRecordInput } from "@/validations/waste.schema";
import { SessionUser } from "@/types";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { createAuditLog, recordTraceability } from "./audit.service";
import { normalizeToKg } from "./analytics.service";
import { WasteReason, DisposalMethod, UserRole } from "@prisma/client";

/**
 * Generates collision-resistant human-readable Waste ID (e.g. WST-2026-0001)
 */
export async function generateWasteHumanId(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `WST-${currentYear}-`;

  const lastRecord = await db.wasteRecord.findFirst({
    where: { humanReadableId: { startsWith: prefix } },
    orderBy: { createdAt: "desc" },
    select: { humanReadableId: true },
  });

  let nextSequence = 1;
  if (lastRecord) {
    const parts = lastRecord.humanReadableId.split("-");
    const num = parseInt(parts[2], 10);
    if (!isNaN(num)) {
      nextSequence = num + 1;
    }
  }

  return `${prefix}${String(nextSequence).padStart(4, "0")}`;
}

/**
 * Creates a dedicated WasteRecord with strict quantity checks, tenant isolation, and audit trail
 */
export async function createWasteRecord(user: SessionUser, input: CreateWasteRecordInput) {
  let finalDonationId: string | null = input.donationId || null;
  let finalDeliveryId: string | null = input.deliveryId || null;

  // 1. If deliveryId is provided, look up the delivery and its donation
  if (finalDeliveryId) {
    const delivery = await db.delivery.findUnique({
      where: { id: finalDeliveryId },
      include: {
        donation: true,
        distributor: true,
        ngo: true,
      },
    });

    if (!delivery) {
      throw new NotFoundError("Referenced delivery task not found.");
    }

    finalDonationId = delivery.donationId;

    // Tenant isolation checks
    if (user.role === "DISTRIBUTOR" && delivery.distributor.userId !== user.id) {
      throw new ForbiddenError("Distributors can only log waste for their own assigned deliveries.");
    }
    if (user.role === "NGO" && delivery.ngo.userId !== user.id) {
      throw new ForbiddenError("NGOs can only log waste for deliveries assigned to their organization.");
    }
    if (user.role === "FOOD_PROVIDER" && delivery.providerId !== user.id) {
      const provider = await db.foodProvider.findUnique({ where: { userId: user.id } });
      if (!provider || delivery.providerId !== provider.id) {
        throw new ForbiddenError("Food providers can only log waste for their own food donations.");
      }
    }

    // Validate waste quantity against original donation quantity
    const totalOriginalKg = normalizeToKg(delivery.donation.quantity, delivery.donation.unit);
    const incomingWasteKg = normalizeToKg(input.quantityWasted, input.unit);

    if (incomingWasteKg > totalOriginalKg) {
      throw new ValidationError(
        `Wasted quantity (${input.quantityWasted} ${input.unit}) cannot exceed original batch quantity (${delivery.donation.quantity} ${delivery.donation.unit}).`
      );
    }

    // Check prior waste records on this donation
    const priorWaste = await db.wasteRecord.findMany({
      where: { donationId: delivery.donationId },
    });
    const priorWasteKg = priorWaste.reduce((acc, r) => acc + normalizeToKg(r.quantityWasted, r.unit), 0);

    if (priorWasteKg + incomingWasteKg > totalOriginalKg + 0.001) {
      throw new ValidationError(
        `Total wasted quantity (${priorWasteKg + incomingWasteKg} kg) exceeds original donation amount (${totalOriginalKg} kg).`
      );
    }
  } else if (finalDonationId) {
    // If only donationId is provided
    const donation = await db.foodDonation.findUnique({
      where: { id: finalDonationId },
      include: { provider: true },
    });

    if (!donation) {
      throw new NotFoundError("Referenced food donation not found.");
    }

    if (user.role === "FOOD_PROVIDER" && donation.provider.userId !== user.id) {
      throw new ForbiddenError("Food providers can only log waste for their own food donations.");
    }

    const totalOriginalKg = normalizeToKg(donation.quantity, donation.unit);
    const incomingWasteKg = normalizeToKg(input.quantityWasted, input.unit);

    if (incomingWasteKg > totalOriginalKg) {
      throw new ValidationError(
        `Wasted quantity (${input.quantityWasted} ${input.unit}) cannot exceed original batch quantity (${donation.quantity} ${donation.unit}).`
      );
    }

    const priorWaste = await db.wasteRecord.findMany({
      where: { donationId: donation.id },
    });
    const priorWasteKg = priorWaste.reduce((acc, r) => acc + normalizeToKg(r.quantityWasted, r.unit), 0);

    if (priorWasteKg + incomingWasteKg > totalOriginalKg + 0.001) {
      throw new ValidationError(
        `Total wasted quantity (${priorWasteKg + incomingWasteKg} kg) exceeds original donation amount (${totalOriginalKg} kg).`
      );
    }
  }

  // 2. Generate unique ID & persist WasteRecord
  const humanReadableId = await generateWasteHumanId();

  const record = await db.wasteRecord.create({
    data: {
      humanReadableId,
      donationId: finalDonationId,
      deliveryId: finalDeliveryId,
      recordedByUserId: user.id,
      recordedRole: user.role as UserRole,
      foodName: input.foodName,
      foodCategory: input.foodCategory,
      quantityWasted: input.quantityWasted,
      unit: input.unit || "KG",
      reason: input.reason as WasteReason,
      disposalMethod: (input.disposalMethod || "NOT_SPECIFIED") as DisposalMethod,
      stage: input.stage,
      notes: input.notes,
      photoUrl: input.photoUrl,
    },
    include: {
      donation: true,
      delivery: true,
      recordedBy: true,
    },
  });

  // 3. Create AuditLog entry
  await createAuditLog({
    userId: user.id,
    actorRole: user.role,
    action: "WASTE_RECORDED",
    entity: "WASTE_RECORD",
    entityId: record.id,
    metadata: {
      humanReadableId: record.humanReadableId,
      quantityWasted: record.quantityWasted,
      unit: record.unit,
      reason: record.reason,
      disposalMethod: record.disposalMethod,
      stage: record.stage,
    },
  });

  // 4. Create TraceabilityLog entry if linked to a donation
  if (finalDonationId) {
    await recordTraceability({
      donationId: finalDonationId,
      stage: "WASTE_DOCUMENTED",
      actor: user.name,
      actorRole: user.role,
      action: `Waste Logged: ${record.reason.replace(/_/g, " ")}`,
      description: `${record.quantityWasted} ${record.unit} discarded at stage "${record.stage}". Disposal: ${record.disposalMethod.replace(/_/g, " ")}. Notes: ${record.notes || "None"}`,
      metadata: {
        wasteRecordId: record.id,
        humanReadableId: record.humanReadableId,
        photoUrl: record.photoUrl,
      },
    });
  }

  return record;
}

/**
 * Queries waste records with multi-tenant isolation and search/filtering
 */
export async function getWasteRecords(
  user: SessionUser,
  filters?: {
    reason?: string;
    disposalMethod?: string;
    stage?: string;
    search?: string;
    from?: Date;
    to?: Date;
  }
) {
  const where: any = {};

  // Role-based tenant isolation
  if (user.role === "FOOD_PROVIDER") {
    const provider = await db.foodProvider.findUnique({ where: { userId: user.id } });
    if (!provider) return [];
    where.OR = [
      { recordedByUserId: user.id },
      { donation: { providerId: provider.id } },
    ];
  } else if (user.role === "NGO") {
    const ngo = await db.ngo.findUnique({ where: { userId: user.id } });
    if (!ngo) return [];
    where.OR = [
      { recordedByUserId: user.id },
      { delivery: { ngoId: ngo.id } },
    ];
  } else if (user.role === "DISTRIBUTOR") {
    const dist = await db.distributor.findUnique({ where: { userId: user.id } });
    if (!dist) return [];
    where.OR = [
      { recordedByUserId: user.id },
      { delivery: { distributorId: dist.id } },
    ];
  }
  // Admin sees all records

  // Apply filters
  if (filters?.reason && filters.reason !== "ALL") {
    where.reason = filters.reason as WasteReason;
  }
  if (filters?.disposalMethod && filters.disposalMethod !== "ALL") {
    where.disposalMethod = filters.disposalMethod as DisposalMethod;
  }
  if (filters?.stage && filters.stage !== "ALL") {
    where.stage = filters.stage;
  }
  if (filters?.search) {
    where.OR = [
      ...(where.OR || []),
      { humanReadableId: { contains: filters.search, mode: "insensitive" } },
      { foodName: { contains: filters.search, mode: "insensitive" } },
      { notes: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  if (filters?.from || filters?.to) {
    where.recordedAt = {};
    if (filters.from && !isNaN(filters.from.getTime())) where.recordedAt.gte = filters.from;
    if (filters.to && !isNaN(filters.to.getTime())) where.recordedAt.lte = filters.to;
  }

  return db.wasteRecord.findMany({
    where,
    include: {
      donation: { include: { provider: true } },
      delivery: {
        include: {
          ngo: true,
          distributor: { include: { user: true } },
        },
      },
      recordedBy: true,
    },
    orderBy: { recordedAt: "desc" },
  });
}

/**
 * Aggregates waste metrics, reason distribution, disposal circularity, and monthly trends
 */
export async function getWasteStats(user: SessionUser) {
  const records = await getWasteRecords(user);

  let totalWastedKg = 0;
  const reasonMap: Record<string, number> = {};
  const disposalMap: Record<string, number> = {};
  const stageMap: Record<string, number> = {};

  for (const r of records) {
    const kg = normalizeToKg(r.quantityWasted, r.unit);
    totalWastedKg += kg;

    const reasonKey = r.reason.replace(/_/g, " ");
    reasonMap[reasonKey] = (reasonMap[reasonKey] || 0) + kg;

    const disposalKey = r.disposalMethod.replace(/_/g, " ");
    disposalMap[disposalKey] = (disposalMap[disposalKey] || 0) + kg;

    stageMap[r.stage] = (stageMap[r.stage] || 0) + kg;
  }

  const byReason = Object.entries(reasonMap).map(([name, value]) => ({
    name,
    value: Math.round(value * 10) / 10,
  }));

  const byDisposalMethod = Object.entries(disposalMap).map(([name, value]) => ({
    name,
    value: Math.round(value * 10) / 10,
  }));

  const byStage = Object.entries(stageMap).map(([name, value]) => ({
    name,
    value: Math.round(value * 10) / 10,
  }));

  // Circularity calculations: Compost + Animal Feed + Bio-energy vs Landfill
  let compostedKg = (disposalMap["COMPOSTING"] || 0) + (disposalMap["ANIMAL FEED"] || 0) + (disposalMap["BIO ENERGY ANAEROBIC"] || 0);
  let landfillKg = disposalMap["LANDFILL DISPOSAL"] || 0;
  const compostOrRecycledPercent = totalWastedKg > 0 ? Math.round((compostedKg / totalWastedKg) * 1000) / 10 : 0;

  return {
    totalRecords: records.length,
    totalWastedKg: Math.round(totalWastedKg * 10) / 10,
    compostedKg: Math.round(compostedKg * 10) / 10,
    landfillKg: Math.round(landfillKg * 10) / 10,
    compostOrRecycledPercent,
    byReason,
    byDisposalMethod,
    byStage,
  };
}