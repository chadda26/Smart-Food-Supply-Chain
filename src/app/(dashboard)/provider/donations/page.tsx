import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDate } from "@/lib/utils";
import { Plus, Package, Clock, Eye } from "lucide-react";

export default async function ProviderDonationsPage() {
  const user = await requireRole("FOOD_PROVIDER");
  const provider = await db.foodProvider.findUnique({ where: { userId: user.id } });

  const donations = await db.foodDonation.findMany({
    where: { providerId: provider?.id },
    include: {
      requests: { include: { ngo: true } },
      delivery: { include: { distributor: { include: { user: true } }, ngo: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DashboardLayout user={user}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Food Donation Batches</h2>
            <p className="text-xs text-slate-500">Manage your surplus batches, quality compliance, and dispatch handoffs</p>
          </div>
          <Link href="/provider/donations/create">
            <Button variant="primary" size="sm">
              <Plus className="w-4 h-4 mr-1" /> New Donation Batch
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/70 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3">Batch ID</th>
                    <th className="px-6 py-3">Food Item</th>
                    <th className="px-6 py-3">Category</th>
                    <th className="px-6 py-3">Quantity</th>
                    <th className="px-6 py-3">Expiry</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {donations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        No food donation batches registered yet.
                      </td>
                    </tr>
                  ) : (
                    donations.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-slate-900">{d.humanReadableId}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            {d.imageUrl ? (
                              <img
                                src={d.imageUrl}
                                alt={d.foodName}
                                className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shrink-0">
                                <Package className="w-4 h-4" />
                              </div>
                            )}
                            <span className="font-semibold text-slate-900">{d.foodName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 capitalize text-slate-600">{d.foodCategory.toLowerCase().replace(/_/g, " ")}</td>
                        <td className="px-6 py-4 font-semibold text-slate-900">{d.quantity} {d.unit}</td>
                        <td className="px-6 py-4 text-slate-500">{formatDate(d.expiryTime)}</td>
                        <td className="px-6 py-4"><StatusBadge status={d.status} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}