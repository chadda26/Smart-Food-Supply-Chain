import { db } from "@/lib/db";
import { calculateImpactFromKg } from "@/lib/impact";
import { ImpactMetrics } from "@/types";

export async function getGlobalImpactMetrics(): Promise<ImpactMetrics> {
  const [
    donations,
    completedDeliveries,
    activeDeliveries,
    ngosCount,
    providersCount,
  ] = await Promise.all([
    db.foodDonation.findMany({
      select: { quantity: true, unit: true, status: true },
    }),
    db.delivery.count({ where: { status: "COMPLETED" } }),
    db.delivery.count({ where: { status: { in: ["ASSIGNED", "PICKUP_IN_PROGRESS", "PICKED_UP", "IN_TRANSIT"] } } }),
    db.ngo.count({ where: { verificationStatus: "VERIFIED" } }),
    db.foodProvider.count({ where: { verificationStatus: "VERIFIED" } }),
  ]);

  let totalDonatedKg = 0;
  let totalSavedKg = 0;

  for (const d of donations) {
    let weightInKg = d.quantity;
    if (d.unit === "PORTIONS") weightInKg = d.quantity * 0.45;
    else if (d.unit === "BOXES") weightInKg = d.quantity * 10;
    else if (d.unit === "LITERS") weightInKg = d.quantity * 1.0;

    totalDonatedKg += weightInKg;
    if (d.status === "COMPLETED" || d.status === "DELIVERED") {
      totalSavedKg += weightInKg;
    }
  }

  const calculated = calculateImpactFromKg(totalSavedKg);

  return {
    totalFoodDonatedKg: Math.round(totalDonatedKg * 10) / 10,
    totalFoodDeliveredKg: Math.round(totalSavedKg * 10) / 10,
    totalFoodSavedKg: Math.round(totalSavedKg * 10) / 10,
    completedDonationsCount: completedDeliveries,
    activeDeliveriesCount: activeDeliveries,
    ngosServedCount: ngosCount,
    providersActiveCount: providersCount,
    ...calculated,
  };
}

export async function getProviderImpactMetrics(providerId: string) {
  const donations = await db.foodDonation.findMany({
    where: { providerId },
    select: { quantity: true, unit: true, status: true },
  });

  let totalKg = 0;
  let rescuedKg = 0;
  let completedCount = 0;

  for (const d of donations) {
    let weightInKg = d.quantity;
    if (d.unit === "PORTIONS") weightInKg = d.quantity * 0.45;
    else if (d.unit === "BOXES") weightInKg = d.quantity * 10;
    totalKg += weightInKg;

    if (d.status === "COMPLETED" || d.status === "DELIVERED") {
      rescuedKg += weightInKg;
      completedCount++;
    }
  }

  return {
    totalDonations: donations.length,
    completedDonations: completedCount,
    totalKgDonated: Math.round(totalKg * 10) / 10,
    totalKgRescued: Math.round(rescuedKg * 10) / 10,
    ...calculateImpactFromKg(rescuedKg),
  };
}

export async function getNgoImpactMetrics(ngoId: string) {
  const deliveries = await db.delivery.findMany({
    where: { ngoId, status: "COMPLETED" },
    include: { donation: true },
  });

  let receivedKg = 0;
  for (const del of deliveries) {
    let weight = del.donation.quantity;
    if (del.donation.unit === "PORTIONS") weight *= 0.45;
    else if (del.donation.unit === "BOXES") weight *= 10;
    receivedKg += weight;
  }

  return {
    totalDeliveriesReceived: deliveries.length,
    totalKgReceived: Math.round(receivedKg * 10) / 10,
    ...calculateImpactFromKg(receivedKg),
  };
}