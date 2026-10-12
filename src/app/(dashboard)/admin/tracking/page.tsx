import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TrackingMap } from "@/components/maps/TrackingMap";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/common/StatusBadge";
import { MapPin, Navigation, Truck } from "lucide-react";

export default async function AdminTrackingPage({
  searchParams,
}: {
  searchParams?: { deliveryId?: string };
}) {
  const user = await requireRole("ADMIN");

  const allDeliveries = await db.delivery.findMany({
    include: {
      donation: { include: { provider: true } },
      distributor: { include: { user: true } },
      ngo: true,
      locationUpdates: { orderBy: { timestamp: "desc" }, take: 10 },
    },
    orderBy: { updatedAt: "desc" },
  });

  const requestedId = searchParams?.deliveryId;
  const activeDelivery = requestedId
    ? allDeliveries.find(
        (d) => d.id === requestedId || d.donation.humanReadableId === requestedId
      ) || allDeliveries[0]
    : allDeliveries[0] || null;

  const latestLoc = activeDelivery?.locationUpdates?.[0] || null;

  return (
    <DashboardLayout user={user}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Live Logistics & Fleet Tracking</h2>
            <p className="text-xs text-slate-500">Real-time GPS telemetry from active logistics carriers</p>
          </div>
          {activeDelivery && <StatusBadge status={activeDelivery.status} />}
        </div>

        {/* Delivery Selector Bar if multiple deliveries exist */}
        {allDeliveries.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-500 font-semibold shrink-0">Select Active Fleet:</span>
            {allDeliveries.map((del) => {
              const isSelected = activeDelivery?.id === del.id;
              return (
                <Link
                  key={del.id}
                  href={`/admin/tracking?deliveryId=${del.id}`}
                  className={`px-3 py-1.5 rounded-lg border font-mono shrink-0 transition-colors flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-slate-900 text-white border-slate-900 font-bold"
                      : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>{del.donation.humanReadableId}</span>
                  <span className="text-[10px] opacity-75 font-sans">({del.donation.provider.organizationName})</span>
                </Link>
              );
            })}
          </div>
        )}

        {activeDelivery ? (
          <div className="space-y-6">
            <TrackingMap
              providerLocation={{
                latitude: activeDelivery.donation.provider.latitude,
                longitude: activeDelivery.donation.provider.longitude,
                name: activeDelivery.donation.provider.organizationName,
                address: activeDelivery.donation.provider.address,
              }}
              ngoLocation={{
                latitude: activeDelivery.ngo.latitude,
                longitude: activeDelivery.ngo.longitude,
                name: activeDelivery.ngo.organizationName,
                address: activeDelivery.ngo.address,
              }}
              driverLocation={latestLoc}
              driverName={activeDelivery.distributor.user.name}
              vehicleType={activeDelivery.distributor.vehicleType}
              status={activeDelivery.status}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
              <Card className="p-4">
                <span className="text-slate-400 block mb-1">Pickup Location (Donor)</span>
                <p className="font-bold text-slate-900">{activeDelivery.donation.provider.organizationName}</p>
                <p className="text-slate-500 mt-0.5">{activeDelivery.donation.provider.address}</p>
                <span className="text-emerald-700 font-medium block mt-1">
                  Batch: {activeDelivery.donation.foodName} ({activeDelivery.donation.quantity} {activeDelivery.donation.unit})
                </span>
              </Card>
              <Card className="p-4">
                <span className="text-slate-400 block mb-1">Assigned Driver & Vehicle</span>
                <p className="font-bold text-slate-900">{activeDelivery.distributor.user.name}</p>
                <p className="text-slate-500 mt-0.5">
                  Vehicle: <span className="capitalize">{activeDelivery.distributor.vehicleType.toLowerCase()}</span> &bull; Rating: {activeDelivery.distributor.reliabilityScore}★
                </p>
                <span className="text-slate-500 block mt-1">
                  Phone: {activeDelivery.distributor.user.phone || "On dispatch"}
                </span>
              </Card>
              <Card className="p-4">
                <span className="text-slate-400 block mb-1">Drop-off Destination (NGO)</span>
                <p className="font-bold text-slate-900">{activeDelivery.ngo.organizationName}</p>
                <p className="text-slate-500 mt-0.5">{activeDelivery.ngo.address}</p>
                <span className="text-slate-500 block mt-1">City: {activeDelivery.ngo.city}</span>
              </Card>
            </div>
          </div>
        ) : (
          <Card className="p-16 text-center text-xs text-slate-400">
            No deliveries are currently in transit. Dispatched tasks will automatically render on the live GPS map.
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}