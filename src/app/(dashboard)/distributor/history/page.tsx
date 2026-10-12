import React from "react";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDate } from "@/lib/utils";

export default async function DistributorHistoryPage() {
  const user = await requireRole("DISTRIBUTOR");
  const distributor = await db.distributor.findUnique({ where: { userId: user.id } });

  const deliveries = await db.delivery.findMany({
    where: {
      distributorId: distributor?.id,
      status: "COMPLETED",
    },
    include: {
      donation: { include: { provider: true } },
      ngo: true,
      deliveryVerification: true,
    },
    orderBy: { completedAt: "desc" },
  });

  return (
    <DashboardLayout user={user}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Completed Delivery Records</h2>
          <p className="text-xs text-slate-500">History of verified surplus food transfers</p>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/70 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3">Batch ID</th>
                    <th className="px-6 py-3">Food Item</th>
                    <th className="px-6 py-3">Provider</th>
                    <th className="px-6 py-3">Recipient NGO</th>
                    <th className="px-6 py-3">Quantity Delivered</th>
                    <th className="px-6 py-3">Completed Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deliveries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        No completed deliveries yet.
                      </td>
                    </tr>
                  ) : (
                    deliveries.map((del) => (
                      <tr key={del.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-slate-900">{del.donation.humanReadableId}</td>
                        <td className="px-6 py-4 font-semibold text-slate-900">{del.donation.foodName}</td>
                        <td className="px-6 py-4 text-slate-700">{del.donation.provider.organizationName}</td>
                        <td className="px-6 py-4 text-slate-700">{del.ngo.organizationName}</td>
                        <td className="px-6 py-4 font-medium text-emerald-800">
                          {del.deliveryVerification?.receivedQuantity || del.donation.quantity} {del.donation.unit}
                        </td>
                        <td className="px-6 py-4 text-slate-400">{formatDate(del.completedAt)}</td>
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