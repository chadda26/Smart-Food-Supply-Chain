import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDate, formatTimeRemaining } from "@/lib/utils";
import { Package, PlusCircle, Truck, HeartHandshake, ArrowRight, ShieldCheck, Leaf } from "lucide-react";
import { getProviderImpactMetrics } from "@/services/impact.service";

export default async function ProviderDashboardPage() {
  const user = await requireRole("FOOD_PROVIDER");
  const provider = await db.foodProvider.findUnique({
    where: { userId: user.id },
  });

  const donations = await db.foodDonation.findMany({
    where: { providerId: provider?.id },
    include: {
      delivery: { include: { distributor: { include: { user: true } }, ngo: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  const activeDonationsCount = await db.foodDonation.count({
    where: {
      providerId: provider?.id,
      status: { in: ["SUBMITTED", "APPROVED", "REQUESTED", "MATCHED", "ASSIGNED", "PICKUP_IN_PROGRESS", "IN_TRANSIT"] },
    },
  });

  const pendingPickupCount = await db.foodDonation.count({
    where: {
      providerId: provider?.id,
      status: { in: ["ASSIGNED", "PICKUP_IN_PROGRESS"] },
    },
  });

  const impact = provider ? await getProviderImpactMetrics(provider.id) : null;

  return (
    <DashboardLayout user={user}>
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8 bg-gradient-to-r from-emerald-800 to-slate-900 rounded-2xl p-6 text-white shadow-md">
        <div>
          <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider block">
            Food Provider Operations
          </span>
          <h2 className="text-2xl font-bold tracking-tight mt-1">
            Welcome, {provider?.organizationName || user.name}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Register surplus food batches, coordinate with verified NGOs, and track driver dispatches with real-time GPS.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/provider/donations/create">
            <Button variant="success" size="md">
              <PlusCircle className="w-4 h-4 mr-2" /> New Food Donation
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Donations</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{activeDonationsCount}</p>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 block">In lifecycle / transit</span>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Food Donated</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Leaf className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{impact?.totalKgDonated || 0} kg</p>
          <span className="text-[11px] text-blue-600 font-medium mt-1 block">{impact?.mealsServed || 0} meals served</span>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pending Pickups</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{pendingPickupCount}</p>
          <span className="text-[11px] text-amber-600 font-medium mt-1 block">Awaiting driver arrival</span>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Completed Rescues</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{impact?.completedDonations || 0}</p>
          <span className="text-[11px] text-purple-600 font-medium mt-1 block">{impact?.co2SavedKg || 0} kg CO2e saved</span>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Recent Food Batches</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">Your submitted and active surplus food batches</p>
          </div>
          <Link href="/provider/donations" className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/70 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3">Donation ID</th>
                  <th className="px-6 py-3">Food Item</th>
                  <th className="px-6 py-3">Quantity</th>
                  <th className="px-6 py-3">Expiry Urgency</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {donations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      No food batches created yet. Click "New Food Donation" to begin.
                    </td>
                  </tr>
                ) : (
                  donations.map((d) => {
                    const remaining = formatTimeRemaining(d.expiryTime);
                    return (
                      <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-slate-900">
                          {d.humanReadableId}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-slate-900 block">{d.foodName}</span>
                          <span className="text-[11px] text-slate-500 capitalize">{d.foodCategory.toLowerCase().replace(/_/g, " ")}</span>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-800">
                          {d.quantity} {d.unit}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-md font-medium text-[11px] ${remaining.isUrgent ? "bg-rose-50 text-rose-700 font-bold" : "text-slate-600 bg-slate-100"}`}>
                            {remaining.text}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={d.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/provider/donations/${d.id}`}>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
