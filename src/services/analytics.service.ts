import { db } from "@/lib/db";
import { calculateImpactFromKg } from "@/lib/impact";
import { ImpactMetrics } from "@/types";

export type DateRangeFilter = "7d" | "30d" | "90d" | "all" | "custom";

export interface AnalyticsDateFilter {
  range?: DateRangeFilter;
  from?: Date;
  to?: Date;
}

export interface MonthlyTrendData {
  month: string;
  rescuedKg: number;
  donatedKg: number;
  deliveriesCount: number;
}

export interface CategoryBreakdown {
  name: string;
  value: number;
  count: number;
}

export interface DistributorAnalyticsItem {
  id: string;
  name: string;
  vehicleType: string;
  reliabilityScore: number;
  totalDeliveries: number;
  completedDeliveries: number;
  averageRating: number | null;
}

export interface StakeholderPerformance {
  topProviders: {
    id: string;
    organizationName: string;
    city: string;
    donationsCount: number;
    totalKgDonated: number;
    totalKgRescued: number;
  }[];
  topNgos: {
    id: string;
    organizationName: string;
    city: string;
    requestsCount: number;
    deliveriesReceived: number;
    totalKgReceived: number;
    mealsDistributed: number;
  }[];
}

export interface LogisticsAnalytics {
  totalDeliveries: number;
  completedDeliveries: number;
  activeDeliveries: number;
  disputedDeliveries: number;
  averageTransitMinutes: number | null;
  distributors: DistributorAnalyticsItem[];
}

export interface DonationAnalytics {
  totalCount: number;
  approvedCount: number;
  pendingCount: number;
  completedCount: number;
  cancelledOrRejectedCount: number;
  expiredCount: number;
  totalDonatedKg: number;
  totalRescuedKg: number;
  diversionEfficiencyPercent: number;
  categories: CategoryBreakdown[];
}

export interface DerivedWasteAnalytics {
  actualRecordedWasteKg: number;
  actualWasteRecordsCount: number;
  actualCompostedKg: number;
  actualLandfillKg: number;
  circularityPercent: number;
  expiredDonationsCount: number;
  expiredEstimatedKg: number;
  rejectedOrCancelledCount: number;
  rejectedOrCancelledKg: number;
  disputedDeliveriesCount: number;
  disputedKg: number;
}

export interface AdminAnalyticsReport {
  dateRange: {
    filter: DateRangeFilter;
    startDate: string | null;
    endDate: string | null;
  };
  overview: {
    totalUsers: number;
    totalProviders: number;
    totalNgos: number;
    totalDistributors: number;
  };
  donations: DonationAnalytics;
  logistics: LogisticsAnalytics;
  stakeholders: StakeholderPerformance;
  wasteAndExpiry: DerivedWasteAnalytics;
  impact: ImpactMetrics;
  monthlyTrend: MonthlyTrendData[];
}

/**
 * Normalizes any quantity/unit pair to standard kilograms
 */
export function normalizeToKg(quantity: number, unit: string): number {
  const q = Number(quantity) || 0;
  const u = (unit || "KG").toUpperCase();
  if (u === "PORTIONS") return q * 0.45;
  if (u === "BOXES") return q * 10;
  if (u === "LITERS" || u === "L") return q * 1.0;
  return q;
}

/**
 * Builds standard Prisma DateTime filter object based on date range key or custom dates
 */
export function buildDateFilter(filter?: AnalyticsDateFilter): { gte?: Date; lte?: Date } | undefined {
  if (!filter || filter.range === "all") return undefined;

  const now = new Date();
  if (filter.range === "7d") {
    return { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), lte: now };
  }
  if (filter.range === "30d") {
    return { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), lte: now };
  }
  if (filter.range === "90d") {
    return { gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), lte: now };
  }
  if (filter.range === "custom" && (filter.from || filter.to)) {
    const res: { gte?: Date; lte?: Date } = {};
    if (filter.from && !isNaN(filter.from.getTime())) res.gte = filter.from;
    if (filter.to && !isNaN(filter.to.getTime())) res.lte = filter.to;
    return Object.keys(res).length > 0 ? res : undefined;
  }
  return undefined;
}

/**
 * Queries and aggregates comprehensive real-time admin analytics
 */
export async function getComprehensiveAdminAnalytics(
  filter?: AnalyticsDateFilter
): Promise<AdminAnalyticsReport> {
  const dateQuery = buildDateFilter(filter);
  const donationWhere = dateQuery ? { createdAt: dateQuery } : {};
  const deliveryWhere = dateQuery ? { createdAt: dateQuery } : {};

  // 1. Overview entity counts
  const [totalUsers, totalProviders, totalNgos, totalDistributors] = await Promise.all([
    db.user.count(),
    db.foodProvider.count(),
    db.ngo.count(),
    db.distributor.count(),
  ]);

  // 2. Query donations with related providers and requests
  const donations = await db.foodDonation.findMany({
    where: donationWhere,
    include: {
      provider: true,
      requests: true,
      delivery: {
        include: {
          deliveryVerification: true,
          feedback: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // 3. Query all deliveries in range
  const deliveries = await db.delivery.findMany({
    where: deliveryWhere,
    include: {
      donation: true,
      distributor: { include: { user: true } },
      ngo: true,
      deliveryVerification: true,
      feedback: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // 3b. Query all waste records in range
  const wasteWhere = dateQuery ? { recordedAt: dateQuery } : {};
  const wasteRecords = await db.wasteRecord.findMany({
    where: wasteWhere,
  });

  // 4. Compute Donation Analytics
  let totalDonatedKg = 0;
  let totalRescuedKg = 0;
  let approvedCount = 0;
  let pendingCount = 0;
  let completedCount = 0;
  let cancelledOrRejectedCount = 0;
  let expiredCount = 0;
  let expiredEstimatedKg = 0;
  let rejectedOrCancelledKg = 0;

  const categoryMap: Record<string, { weight: number; count: number }> = {};
  const now = new Date();

  for (const d of donations) {
    const weightKg = normalizeToKg(d.quantity, d.unit);
    totalDonatedKg += weightKg;

    // Category aggregation
    const cat = d.foodCategory || "OTHER";
    if (!categoryMap[cat]) categoryMap[cat] = { weight: 0, count: 0 };
    categoryMap[cat].weight += weightKg;
    categoryMap[cat].count += 1;

    // Status breakdown
    if (d.status === "SUBMITTED") {
      pendingCount++;
    } else if (["APPROVED", "REQUESTED", "MATCHED", "ASSIGNED", "PICKUP_IN_PROGRESS", "PICKED_UP", "IN_TRANSIT"].includes(d.status)) {
      approvedCount++;
    } else if (d.status === "COMPLETED" || d.status === "DELIVERED") {
      completedCount++;
      totalRescuedKg += weightKg;
    } else if (d.status === "REJECTED" || d.status === "CANCELLED") {
      cancelledOrRejectedCount++;
      rejectedOrCancelledKg += weightKg;
    } else if (d.status === "EXPIRED" || d.expiryTime < now) {
      expiredCount++;
      expiredEstimatedKg += weightKg;
    }
  }

  const categoryBreakdown: CategoryBreakdown[] = Object.entries(categoryMap).map(([k, v]) => ({
    name: k.replace(/_/g, " "),
    value: Math.round(v.weight * 10) / 10,
    count: v.count,
  }));

  const diversionEfficiencyPercent = totalDonatedKg > 0
    ? Math.round((totalRescuedKg / totalDonatedKg) * 1000) / 10
    : 0;

  // 5. Compute Delivery / Logistics Analytics
  let activeDeliveries = 0;
  let completedDeliveries = 0;
  let disputedDeliveries = 0;
  let disputedKg = 0;
  let totalTransitMinutes = 0;
  let validTransitCount = 0;

  const distributorMap: Record<string, {
    distributor: any;
    total: number;
    completed: number;
    ratings: number[];
  }> = {};

  for (const del of deliveries) {
    if (del.status === "COMPLETED") {
      completedDeliveries++;
    } else if (["ASSIGNED", "PICKUP_IN_PROGRESS", "PICKED_UP", "IN_TRANSIT"].includes(del.status)) {
      activeDeliveries++;
    }

    if (del.status === "DISPUTED" || del.deliveryVerification?.status === "DISPUTED" || del.deliveryVerification?.disputeReason) {
      disputedDeliveries++;
      disputedKg += normalizeToKg(del.donation.quantity, del.donation.unit);
    }

    // Transit duration calculation
    if (del.startedAt && del.completedAt) {
      const diffMs = new Date(del.completedAt).getTime() - new Date(del.startedAt).getTime();
      if (diffMs > 0) {
        totalTransitMinutes += diffMs / (1000 * 60);
        validTransitCount++;
      }
    }

    // Distributor aggregation
    const distId = del.distributorId;
    if (!distributorMap[distId]) {
      distributorMap[distId] = {
        distributor: del.distributor,
        total: 0,
        completed: 0,
        ratings: [],
      };
    }
    distributorMap[distId].total++;
    if (del.status === "COMPLETED") distributorMap[distId].completed++;
    if (del.feedback?.rating) distributorMap[distId].ratings.push(del.feedback.rating);
  }

  const averageTransitMinutes = validTransitCount > 0
    ? Math.round((totalTransitMinutes / validTransitCount) * 10) / 10
    : null;

  const distributorItems: DistributorAnalyticsItem[] = Object.values(distributorMap).map((item) => {
    const avgRating = item.ratings.length > 0
      ? Math.round((item.ratings.reduce((a, b) => a + b, 0) / item.ratings.length) * 10) / 10
      : null;

    return {
      id: item.distributor.id,
      name: item.distributor.user.name,
      vehicleType: item.distributor.vehicleType,
      reliabilityScore: item.distributor.reliabilityScore,
      totalDeliveries: item.total,
      completedDeliveries: item.completed,
      averageRating: avgRating,
    };
  });

  // 6. Stakeholder Performance (Providers & NGOs)
  const providerStatsMap: Record<string, {
    provider: any;
    count: number;
    donatedKg: number;
    rescuedKg: number;
  }> = {};

  for (const d of donations) {
    const pId = d.providerId;
    if (!providerStatsMap[pId]) {
      providerStatsMap[pId] = {
        provider: d.provider,
        count: 0,
        donatedKg: 0,
        rescuedKg: 0,
      };
    }
    const w = normalizeToKg(d.quantity, d.unit);
    providerStatsMap[pId].count++;
    providerStatsMap[pId].donatedKg += w;
    if (d.status === "COMPLETED" || d.status === "DELIVERED") {
      providerStatsMap[pId].rescuedKg += w;
    }
  }

  const topProviders = Object.values(providerStatsMap).map((p) => ({
    id: p.provider.id,
    organizationName: p.provider.organizationName,
    city: p.provider.city,
    donationsCount: p.count,
    totalKgDonated: Math.round(p.donatedKg * 10) / 10,
    totalKgRescued: Math.round(p.rescuedKg * 10) / 10,
  }));

  const ngoStatsMap: Record<string, {
    ngo: any;
    requests: number;
    deliveries: number;
    receivedKg: number;
  }> = {};

  for (const del of deliveries) {
    const nId = del.ngoId;
    if (!ngoStatsMap[nId]) {
      ngoStatsMap[nId] = {
        ngo: del.ngo,
        requests: 0,
        deliveries: 0,
        receivedKg: 0,
      };
    }
    if (del.status === "COMPLETED") {
      ngoStatsMap[nId].deliveries++;
      ngoStatsMap[nId].receivedKg += normalizeToKg(del.donation.quantity, del.donation.unit);
    }
  }

  const topNgos = Object.values(ngoStatsMap).map((n) => {
    const kg = Math.round(n.receivedKg * 10) / 10;
    return {
      id: n.ngo.id,
      organizationName: n.ngo.organizationName,
      city: n.ngo.city,
      requestsCount: n.requests,
      deliveriesReceived: n.deliveries,
      totalKgReceived: kg,
      mealsDistributed: Math.round(kg * 2.4),
    };
  });

  // 7. Dynamic Monthly Rescued Food Growth Trend (Last 6 Months from Database)
  const monthlyTrend = await calculateDynamicMonthlyTrend();

  // 8. ESG / Impact Metrics using standard formulas
  const impactCalculated = calculateImpactFromKg(totalRescuedKg);
  const impact: ImpactMetrics = {
    totalFoodDonatedKg: Math.round(totalDonatedKg * 10) / 10,
    totalFoodDeliveredKg: Math.round(totalRescuedKg * 10) / 10,
    totalFoodSavedKg: Math.round(totalRescuedKg * 10) / 10,
    completedDonationsCount: completedDeliveries,
    activeDeliveriesCount: activeDeliveries,
    ngosServedCount: totalNgos,
    providersActiveCount: totalProviders,
    ...impactCalculated,
  };

  // Compute actual waste records metrics
  let actualRecordedWasteKg = 0;
  let actualCompostedKg = 0;
  let actualLandfillKg = 0;

  for (const wr of wasteRecords) {
    const kg = normalizeToKg(wr.quantityWasted, wr.unit);
    actualRecordedWasteKg += kg;
    if (["COMPOSTING", "ANIMAL_FEED", "BIO_ENERGY_ANAEROBIC"].includes(wr.disposalMethod)) {
      actualCompostedKg += kg;
    } else if (wr.disposalMethod === "LANDFILL_DISPOSAL") {
      actualLandfillKg += kg;
    }
  }

  const circularityPercent = actualRecordedWasteKg > 0
    ? Math.round((actualCompostedKg / actualRecordedWasteKg) * 1000) / 10
    : 0;

  return {
    dateRange: {
      filter: filter?.range || "all",
      startDate: dateQuery?.gte ? dateQuery.gte.toISOString() : null,
      endDate: dateQuery?.lte ? dateQuery.lte.toISOString() : null,
    },
    overview: {
      totalUsers,
      totalProviders,
      totalNgos,
      totalDistributors,
    },
    donations: {
      totalCount: donations.length,
      approvedCount,
      pendingCount,
      completedCount,
      cancelledOrRejectedCount,
      expiredCount,
      totalDonatedKg: Math.round(totalDonatedKg * 10) / 10,
      totalRescuedKg: Math.round(totalRescuedKg * 10) / 10,
      diversionEfficiencyPercent,
      categories: categoryBreakdown,
    },
    logistics: {
      totalDeliveries: deliveries.length,
      completedDeliveries,
      activeDeliveries,
      disputedDeliveries,
      averageTransitMinutes,
      distributors: distributorItems,
    },
    stakeholders: {
      topProviders,
      topNgos,
    },
    wasteAndExpiry: {
      actualRecordedWasteKg: Math.round(actualRecordedWasteKg * 10) / 10,
      actualWasteRecordsCount: wasteRecords.length,
      actualCompostedKg: Math.round(actualCompostedKg * 10) / 10,
      actualLandfillKg: Math.round(actualLandfillKg * 10) / 10,
      circularityPercent,
      expiredDonationsCount: expiredCount,
      expiredEstimatedKg: Math.round(expiredEstimatedKg * 10) / 10,
      rejectedOrCancelledCount: cancelledOrRejectedCount,
      rejectedOrCancelledKg: Math.round(rejectedOrCancelledKg * 10) / 10,
      disputedDeliveriesCount: disputedDeliveries,
      disputedKg: Math.round(disputedKg * 10) / 10,
    },
    impact,
    monthlyTrend,
  };
}

/**
 * Calculates genuine monthly rescued food trends dynamically from actual DB delivery records
 */
export async function calculateDynamicMonthlyTrend(): Promise<MonthlyTrendData[]> {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();

  // Generate the chronological sequence of the last 6 months
  const months: { year: number; monthIndex: number; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      year: d.getFullYear(),
      monthIndex: d.getMonth(),
      label: `${monthNames[d.getMonth()]} ${d.getFullYear() !== now.getFullYear() ? "'" + String(d.getFullYear()).slice(-2) : ""}`.trim(),
    });
  }

  // Fetch all completed deliveries
  const completedDeliveries = await db.delivery.findMany({
    where: { status: "COMPLETED" },
    include: { donation: true },
  });

  // Fetch all registered donations
  const allDonations = await db.foodDonation.findMany({
    select: { createdAt: true, quantity: true, unit: true },
  });

  return months.map((m) => {
    // Rescued food completed in this specific month
    let rescuedKg = 0;
    let deliveryCount = 0;

    for (const del of completedDeliveries) {
      const completionDate = del.completedAt || del.updatedAt;
      if (
        completionDate.getFullYear() === m.year &&
        completionDate.getMonth() === m.monthIndex
      ) {
        rescuedKg += normalizeToKg(del.donation.quantity, del.donation.unit);
        deliveryCount++;
      }
    }

    // Total food donated in this specific month
    let donatedKg = 0;
    for (const don of allDonations) {
      if (
        don.createdAt.getFullYear() === m.year &&
        don.createdAt.getMonth() === m.monthIndex
      ) {
        donatedKg += normalizeToKg(don.quantity, don.unit);
      }
    }

    return {
      month: m.label,
      rescuedKg: Math.round(rescuedKg * 10) / 10,
      donatedKg: Math.round(donatedKg * 10) / 10,
      deliveriesCount: deliveryCount,
    };
  });
}