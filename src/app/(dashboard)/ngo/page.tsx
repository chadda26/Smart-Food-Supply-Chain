import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDate, formatTimeRemaining } from "@/lib/utils";
import { Package, Inbox, Truck, Heart, ArrowRight, Search } from "lucide-react";
import { getNgoImpactMetrics } from "@/services/impact.service";

export default async function NgoDashboardPage() {
  const user = await requireRole("NGO");
  const ngo = await db.ngo.findUnique({ where: { userId: user.id } });

  const availableFoodCount = await db.foodDonation.count({
    where: {
      status: { in: ["APPROVED", "REQUESTED"] },
      expiryTime: { gt: new Date() },
    },
  });

  const activeRequestsCount = await db.donationRequest.count({
    where: { ngoId: ngo?.id, status: "PENDING" },
  });

  const activeIncomingDeliveries = await db.delivery.findMany({
    where: {
      ngoId: ngo?.id,
      status: { in: ["ASSIGNED", "PICKUP_IN_PROGRESS", "PICKED_UP", "IN_TRANSIT"] },
    },
    include: {
      donation: { include: { provider: true } },
      distributor: { include: { user: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const impact = ngo ? await getNgoImpactMetrics(ngo.id) : null;

  const urgentAvailableFood = await db.foodDonation.findMany({
    where: {
      status: { in: ["APPROVED", "REQUESTED"] },
      expiryTime: { gt: new Date() },
    },
    include: { provider: true },
    orderBy: { expiryTime: "asc" },
    take: 5,
  });

  return (
    <DashboardLayout user={user}>
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8 bg-gradient-to-r from-blue-900 to-slate-900 rounded-2xl p-6 text-white shadow-md">
        <div>
          <span className="text-blue-400 text-xs font-bold uppercase tracking-wider block">
            NGO Distribution & Food Bank Portal
          </span>
          <h2 className="text-2xl font-bold tracking-tight mt-1">
            Welcome, {ngo?.organizationName || user.name}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Browse verified edible surplus food, request allocations for community relief, and track incoming driver dispatches.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/ngo/food">
            <Button variant="primary" size="md">
              <Search className="w-4 h-4 mr-2" /> Browse Available Food
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Available Surplus</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{availableFoodCount}</p>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 block">Ready for allocation request</span>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pending Requests</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Inbox className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{activeRequestsCount}</p>
          <span className="text-[11px] text-amber-600 font-medium mt-1 block">Awaiting admin matching</span>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Food Received</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Heart className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{impact?.totalKgReceived || 0} kg</p>
          <span className="text-[11px] text-blue-600 font-medium mt-1 block">{impact?.mealsServed || 0} meals served</span>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Incoming Deliveries</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{activeIncomingDeliveries.length}</p>
          <span className="text-[11px] text-purple-600 font-medium mt-1 block">En route or scheduled</span>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Surplus Food Ready for Immediate Rescue</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Approved batches prioritized by expiry urgency</p>
              </div>
              <Link href="/ngo/food" className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1">
                Explore All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {urgentAvailableFood.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    No approved surplus food currently available. Check back soon.
                  </div>
                ) : (
                  urgentAvailableFood.map((item) => {
                    const remaining = formatTimeRemaining(item.expiryTime);
                    return (
                      <div key={item.id} className="p-4 hover:bg-slate-50 flex items-center justify-between gap-4 transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{item.foodName}</span>
                            <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {item.humanReadableId}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {item.provider.organizationName} &bull; {item.quantity} {item.unit} &bull; {item.foodCategory.toLowerCase().replace(/_/g, " ")}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-2.5 py-1 rounded-md font-semibold ${remaining.isUrgent ? "bg-rose-50 text-rose-700 font-bold" : "bg-slate-100 text-slate-700"}`}>
                            {remaining.text}
                          </span>
                          <Link href="/ngo/food">
                            <Button variant="primary" size="sm">
                              Request Food
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Active Deliveries</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeIncomingDeliveries.length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-400">
                  No active driver deliveries en route right now.
                </p>
              ) : (
                activeIncomingDeliveries.map((del) => (
                  <div key={del.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{del.donation.foodName}</span>
                      <StatusBadge status={del.status} />
                    </div>
                    <p className="text-slate-500 text-[11px]">
                      Driver: <b>{del.distributor.user.name}</b> ({del.distributor.vehicleType})
                    </p>
                    <Link href={`/ngo/deliveries/${del.id}/track`} className="block">
                      <Button variant="outline" size="sm" className="w-full">
                        <Truck className="w-3.5 h-3.5 mr-1" /> Track Driver Live GPS
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
