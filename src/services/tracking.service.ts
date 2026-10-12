import { db } from "@/lib/db";
import { AppError, NotFoundError, ForbiddenError } from "@/lib/errors";
import { SessionUser } from "@/types";

export async function recordLocationUpdate(
  user: SessionUser,
  params: {
    deliveryId: string;
    latitude: number;
    longitude: number;
    heading?: number | null;
    speed?: number | null;
    accuracy?: number | null;
  }
) {
  const delivery = await db.delivery.findUnique({
    where: { id: params.deliveryId },
    include: { distributor: true },
  });

  if (!delivery) throw new NotFoundError("Delivery not found");
  if (delivery.distributor.userId !== user.id && user.role !== "ADMIN") {
    throw new ForbiddenError("Only the assigned driver can broadcast location updates.");
  }

  const update = await db.locationUpdate.create({
    data: {
      deliveryId: params.deliveryId,
      distributorId: delivery.distributorId,
      latitude: params.latitude,
      longitude: params.longitude,
      heading: params.heading,
      speed: params.speed,
      accuracy: params.accuracy,
      timestamp: new Date(),
    },
  });

  // Maintain bounded location history per delivery (clean up updates older than 2 hours or keep last 50 points)
  const count = await db.locationUpdate.count({ where: { deliveryId: params.deliveryId } });
  if (count > 60) {
    const oldest = await db.locationUpdate.findMany({
      where: { deliveryId: params.deliveryId },
      orderBy: { timestamp: "asc" },
      take: count - 50,
      select: { id: true },
    });
    await db.locationUpdate.deleteMany({
      where: { id: { in: oldest.map((o) => o.id) } },
    });
  }

  return update;
}

export async function getLiveDeliveryTracking(user: SessionUser, deliveryId: string) {
  const delivery = await db.delivery.findUnique({
    where: { id: deliveryId },
    include: {
      donation: { include: { provider: true } },
      distributor: { include: { user: true } },
      ngo: true,
      locationUpdates: {
        orderBy: { timestamp: "desc" },
        take: 20,
      },
    },
  });

  if (!delivery) throw new NotFoundError("Delivery not found");

  // Authorization check: Only assigned Driver, Provider, receiving NGO, or Admin can track
  const isAuthorized =
    user.role === "ADMIN" ||
    delivery.distributor.userId === user.id ||
    delivery.donation.provider.userId === user.id ||
    delivery.ngo.userId === user.id;

  if (!isAuthorized) {
    throw new ForbiddenError("You are not authorized to view live tracking for this delivery.");
  }

  const latestLocation = delivery.locationUpdates[0] || null;

  return {
    deliveryId: delivery.id,
    donationId: delivery.donationId,
    humanReadableId: delivery.donation.humanReadableId,
    foodName: delivery.donation.foodName,
    quantity: delivery.donation.quantity,
    unit: delivery.donation.unit,
    status: delivery.status,
    pickupEta: delivery.pickupEta,
    deliveryEta: delivery.deliveryEta,
    startedAt: delivery.startedAt,
    completedAt: delivery.completedAt,
    provider: {
      name: delivery.donation.provider.organizationName,
      address: delivery.donation.provider.address,
      city: delivery.donation.provider.city,
      latitude: delivery.donation.provider.latitude,
      longitude: delivery.donation.provider.longitude,
    },
    ngo: {
      name: delivery.ngo.organizationName,
      address: delivery.ngo.address,
      city: delivery.ngo.city,
      latitude: delivery.ngo.latitude,
      longitude: delivery.ngo.longitude,
    },
    distributor: {
      name: delivery.distributor.user.name,
      phone: delivery.distributor.user.phone,
      vehicleType: delivery.distributor.vehicleType,
      reliabilityScore: delivery.distributor.reliabilityScore,
    },
    latestLocation: latestLocation
      ? {
          latitude: latestLocation.latitude,
          longitude: latestLocation.longitude,
          heading: latestLocation.heading,
          speed: latestLocation.speed,
          accuracy: latestLocation.accuracy,
          timestamp: latestLocation.timestamp,
        }
      : null,
    recentTrail: delivery.locationUpdates.map((loc) => ({
      latitude: loc.latitude,
      longitude: loc.longitude,
      timestamp: loc.timestamp,
    })),
  };
}