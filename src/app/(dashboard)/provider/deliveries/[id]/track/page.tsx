import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TrackingMap } from "@/components/maps/TrackingMap";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ArrowLeft } from "lucide-react";

export default async function ProviderTrackDeliveryPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireRole(["FOOD_PROVIDER", "ADMIN"]);
  const provider = await db.foodProvider.findUnique({ where: { userId: user.id } });

  const delivery = await db.delivery.findUnique({
    where: { id: params.id },
    include: {
      donation: { include: { provider: true } },
      distributor: { include: { user: true } },
      ngo: true,
      locationUpdates: { orderBy: { timestamp: "desc" }, take: 10 },
    },
  });

  if (!delivery) notFound();
  if (user.role === "FOOD_PROVIDER" && delivery.providerId !== provider?.id) {
    notFound();
  }

  const latestLoc = delivery.locationUpdates[0] || null;

  return (
    <DashboardLayout user={user}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Link href="/provider/deliveries">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            </Link>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Track Outgoing Dispatch - {delivery.donation.humanReadableId}
              </h2>
              <p className="text-xs text-slate-500">Live GPS tracking of surplus food collection and transit</p>
            </div>
          </div>
          <StatusBadge status={delivery.status} />
        </div>

        <TrackingMap
          providerLocation={{
            latitude: delivery.donation.provider.latitude,
            longitude: delivery.donation.provider.longitude,
            name: delivery.donation.provider.organizationName,
            address: delivery.donation.provider.address,
          }}
          ngoLocation={{
            latitude: delivery.ngo.latitude,
            longitude: delivery.ngo.longitude,
            name: delivery.ngo.organizationName,
            address: delivery.ngo.address,
          }}
          driverLocation={latestLoc}
          driverName={delivery.distributor.user.name}
          vehicleType={delivery.distributor.vehicleType}
          status={delivery.status}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
          <Card className="p-4">
            <span className="text-slate-400 block mb-1">Your Kitchen / Facility</span>
            <p className="text-sm font-bold text-slate-900">{delivery.donation.provider.organizationName}</p>
            <p className="text-slate-500 mt-0.5">{delivery.donation.provider.address}</p>
          </Card>
          <Card className="p-4">
            <span className="text-slate-400 block mb-1">Assigned Driver</span>
            <p className="text-sm font-bold text-slate-900">{delivery.distributor.user.name}</p>
            <p className="text-slate-500 mt-0.5">
              Phone: {delivery.distributor.user.phone || "On dispatch"} &bull; {delivery.distributor.vehicleType}
            </p>
          </Card>
          <Card className="p-4">
            <span className="text-slate-400 block mb-1">Recipient NGO</span>
            <p className="text-sm font-bold text-blue-900">{delivery.ngo.organizationName}</p>
            <p className="text-slate-500 mt-0.5">{delivery.ngo.address}</p>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}