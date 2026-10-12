import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDate } from "@/lib/utils";
import { Truck, Package, CheckCircle2, Star, ArrowRight, Radio, MapPin } from "lucide-react";

export default async function DistributorDashboardPage() {
  const user = await requireRole("DISTRIBUTOR");
  const distributor = await db.distributor.findUnique({
    where: { userId: user.id },
  });

  const pendingPickups = await db.delivery.findMany({
    where: {
      distributorId: distributor?.id,
      status: { in: ["ASSIGNED", "PICKUP_IN_PROGRESS"] },
    },
    include: {
      donation: { include: { provider: true } },
      ngo: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const activeDeliveries = await db.delivery.findMany({
    where: {
      distributorId: distributor?.id,
      status: { in: ["PICKED_UP", "IN_TRANSIT"] },
    },
    include: {
      donation: { include: { provider: true } },
      ngo: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const completedCount = await db.delivery.count({
    where: { distributorId: distributor?.id, status: "COMPLETED" },
  });

  return (
    <DashboardLayout user={user}>
      {/* Welcome Banner */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8 bg-gradient-to-r from-emerald-900 to-slate-900 rounded-2xl p-6 text-white shadow-md">
        <div>
          <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider block">
            Logistics & Driver Dispatch Center
          </span>
          <h2 className="text-2xl font-bold tracking-tight mt-1">
            Welcome back, {user.name}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Vehicle: <b>{distributor?.vehicleType}</b> &bull; Status: <span className="text-emerald-300 font-semibold">{distributor?.availabilityStatus}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/distributor/location">
            <Button variant="success" size="md">
              <Radio className="w-4 h-4 mr-2 animate-pulse" /> Launch GPS Broadcaster
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pending Pickups</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{pendingPickups.length}</p>
          <span className="text-[11px] text-amber-600 font-medium mt-1 block">Awaiting kitchen collection</span>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active In-Transit</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{activeDeliveries.length}</p>
          <span className="text-[11px] text-blue-600 font-medium mt-1 block">En route to NGO drop-off</span>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Completed Rescues</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{completedCount}</p>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 block">Successfully verified handoffs</span>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Reliability Score</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <Star className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{distributor?.reliabilityScore.toFixed(1) || "5.0"} ★</p>
          <span className="text-[11px] text-purple-600 font-medium mt-1 block">Based on NGO feedback</span>
        </Card>
      </div>

      {/* Active Tasks & Quick Handoffs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Pickups */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Assigned Pickup Tasks</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Collect surplus food from kitchens</p>
            </div>
            <Link href="/distributor/pickups" className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingPickups.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-400">No pending pickups assigned.</p>
            ) : (
              pendingPickups.map((p) => (
                <div key={p.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{p.donation.foodName}</span>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="text-slate-600">
                    Pickup: <b>{p.donation.provider.organizationName}</b> ({p.donation.provider.address})
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                    <span className="font-medium text-emerald-800">{p.donation.quantity} {p.donation.unit}</span>
                    <Link href={`/distributor/deliveries/${p.id}`}>
                      <Button variant="primary" size="sm">
                        Action Task &rarr;
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Active Deliveries */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Active Transit Shipments</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Shipments currently en route</p>
            </div>
            <Link href="/distributor/deliveries" className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeDeliveries.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-400">No shipments currently in transit.</p>
            ) : (
              activeDeliveries.map((d) => (
                <div key={d.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{d.donation.foodName}</span>
                    <StatusBadge status={d.status} />
                  </div>
                  <p className="text-slate-600">
                    Destination: <b>{d.ngo.organizationName}</b> ({d.ngo.address})
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                    <Link href="/distributor/location">
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <Radio className="w-3.5 h-3.5 animate-pulse" /> Live GPS Transmitting
                      </span>
                    </Link>
                    <Link href={`/distributor/deliveries/${d.id}`}>
                      <Button variant="outline" size="sm">
                        Details &rarr;
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}