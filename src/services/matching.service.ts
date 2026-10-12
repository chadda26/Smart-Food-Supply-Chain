import { db } from "@/lib/db";
import { calculateDistanceKm } from "@/lib/geo";
import { NotFoundError } from "@/lib/errors";

export interface MatchScoreBreakdown {
  ngoId: string;
  ngoName: string;
  ngoAddress: string;
  ngoCity: string;
  latitude: number;
  longitude: number;
  foodCapacity: number;
  availabilityStatus: string;
  verificationStatus: string;
  totalScore: number;
  distanceKm: number;
  distanceScore: number;
  capacityScore: number;
  urgencyScore: number;
  availabilityScore: number;
  rationale: string;
}

export async function calculateMatchesForDonation(donationId: string): Promise<MatchScoreBreakdown[]> {
  const donation = await db.foodDonation.findUnique({
    where: { id: donationId },
    include: { provider: true },
  });

  if (!donation) throw new NotFoundError("Donation not found");

  const ngos = await db.ngo.findMany({
    where: {
      verificationStatus: "VERIFIED",
      availabilityStatus: { in: ["AVAILABLE", "BUSY"] },
    },
  });

  const now = new Date().getTime();
  const expiryTime = new Date(donation.expiryTime).getTime();
  const hoursUntilExpiry = Math.max((expiryTime - now) / (1000 * 60 * 60), 0.5);

  // Expiry Urgency Score (0 to 25 pts) - Shorter expiry gets higher priority
  let urgencyScore = 10;
  if (hoursUntilExpiry <= 6) urgencyScore = 25;
  else if (hoursUntilExpiry <= 12) urgencyScore = 20;
  else if (hoursUntilExpiry <= 24) urgencyScore = 15;
  else if (hoursUntilExpiry <= 48) urgencyScore = 10;
  else urgencyScore = 5;

  const matches: MatchScoreBreakdown[] = ngos.map((ngo) => {
    // 1. Distance & Proximity Score (0 to 35 pts)
    const distanceKm = calculateDistanceKm(
      donation.provider.latitude,
      donation.provider.longitude,
      ngo.latitude,
      ngo.longitude
    );

    let distanceScore = 0;
    if (distanceKm <= 3) distanceScore = 35;
    else if (distanceKm <= 8) distanceScore = 28;
    else if (distanceKm <= 15) distanceScore = 20;
    else if (distanceKm <= 25) distanceScore = 12;
    else distanceScore = Math.max(5, Math.round(35 - distanceKm));

    // 2. Food Capacity Fit Score (0 to 25 pts)
    let capacityScore = 0;
    const capacityRatio = ngo.foodCapacity / Math.max(donation.quantity, 1);
    if (capacityRatio >= 1 && capacityRatio <= 5) {
      capacityScore = 25; // Perfect capacity fit
    } else if (capacityRatio > 5) {
      capacityScore = 20; // Excess capacity
    } else if (capacityRatio >= 0.5) {
      capacityScore = 15; // Partial capacity
    } else {
      capacityScore = 5; // Low capacity
    }

    // 3. Availability Score (0 to 15 pts)
    let availabilityScore = ngo.availabilityStatus === "AVAILABLE" ? 15 : 5;

    const totalScore = Math.min(
      100,
      Math.round(distanceScore + capacityScore + urgencyScore + availabilityScore)
    );

    const rationale = `Distance: ${distanceKm}km (${distanceScore}/35) + Capacity fit: ${ngo.foodCapacity}kg (${capacityScore}/25) + Urgency: ${hoursUntilExpiry.toFixed(1)}h remaining (${urgencyScore}/25) + NGO Status: ${ngo.availabilityStatus} (${availabilityScore}/15)`;

    return {
      ngoId: ngo.id,
      ngoName: ngo.organizationName,
      ngoAddress: ngo.address,
      ngoCity: ngo.city,
      latitude: ngo.latitude,
      longitude: ngo.longitude,
      foodCapacity: ngo.foodCapacity,
      availabilityStatus: ngo.availabilityStatus,
      verificationStatus: ngo.verificationStatus,
      totalScore,
      distanceKm,
      distanceScore,
      capacityScore,
      urgencyScore,
      availabilityScore,
      rationale,
    };
  });

  // Sort descending by highest score
  return matches.sort((a, b) => b.totalScore - a.totalScore);
}