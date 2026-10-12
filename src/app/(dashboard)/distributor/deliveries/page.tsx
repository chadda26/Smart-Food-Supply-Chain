import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDate } from "@/lib/utils";
import { Truck, MapPin, CheckCircle2 } from "lucide-react";

export default async function DistributorDeliveriesPage() {
  const user = await requireRole("DISTRIBUTOR");
  const distributor = await db.distributor.findUnique({ where: { userId: user.id } });

  const deliveries = await db.delivery.findMany({
    where: { distributorId: distributor?.id },
    include: {
      donation: { include: { provider: true } },
      ngo: true,
      pickupVerification: true,
      deliveryVerification: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DashboardLayout user={user}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">All Delivery Assignments</h2>
          <p className="text-xs text-slate-500">Track pickups, active transit legs, and verified drop-offs</p>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/70 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3">Task ID</th>
                    <th className="px-6 py-3">Food Item</th>
                    <th className="px-6 py-3">Pickup (Provider)</th>
                    <th className="px-6 py-3">Drop-off (NGO)</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deliveries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        No delivery tasks recorded yet.
                      </td>
                    </tr>
                  ) : (
                    deliveries.map((del) => (
                      <tr key={del.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-slate-900">{del.donation.humanReadableId}</td>
                        <td className="px-6 py-4 font-semibold text-slate-900">{del.donation.foodName}</td>
                        <td className="px-6 py-4 text-slate-700">{del.donation.provider.organizationName}</td>
                        <td className="px-6 py-4 text-slate-700">{del.ngo.organizationName}</td>
                        <td className="px-6 py-4"><StatusBadge status={del.status} /></td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/distributor/deliveries/${del.id}`}>
                            <Button variant="outline" size="sm">
                              Manage Task &rarr;
                            </Button>
                          </Link>
                        </td>
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