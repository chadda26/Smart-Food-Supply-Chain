import React from "react";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LiveDriverBroadcaster } from "@/components/maps/LiveDriverBroadcaster";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { MapPin, Navigation } from "lucide-react";

export default async function DistributorLocationStationPage() {
  const user = await requireRole("DISTRIBUTOR");
  const distributor = await db.distributor.findUnique({ where: { userId: user.id } });

  const activeDelivery = await db.delivery.findFirst({
    where: {
      distributorId: distributor?.id,
      status: { in: ["PICKUP_IN_PROGRESS", "PICKED_UP", "IN_TRANSIT"] },
    },
    include: {
      donation: { include: { provider: true } },
      ngo: true,
    },
  });

  return (
    <DashboardLayout user={user}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Live GPS Location Telemetry Broadcaster</h2>
          <p className="text-xs text-slate-500">
            Transmit real-time GPS location coordinates to authorized NGO recipients and kitchen providers during transit
          </p>
        </div>

        {activeDelivery ? (
          <div className="space-y-6">
            <Card className="p-4 bg-slate-50 border-slate-200 text-xs">
              <span className="font-bold text-slate-900 block text-sm">
                Active Assignment: {activeDelivery.donation.foodName} ({activeDelivery.donation.humanReadableId})
              </span>
              <p className="text-slate-500 mt-1">
                Route: {activeDelivery.donation.provider.organizationName} &rarr; {activeDelivery.ngo.organizationName}
              </p>
            </Card>

            <LiveDriverBroadcaster
              deliveryId={activeDelivery.id}
              providerLat={activeDelivery.donation.provider.latitude}
              providerLon={activeDelivery.donation.provider.longitude}
              ngoLat={activeDelivery.ngo.latitude}
              ngoLon={activeDelivery.ngo.longitude}
            />
          </div>
        ) : (
          <Card className="p-12 text-center text-slate-500 text-xs">
            <MapPin className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="font-semibold text-slate-800">No active transit task assigned</p>
            <p className="text-slate-400 mt-1">
              Location broadcasting becomes available when a delivery task is accepted and in transit.
            </p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}