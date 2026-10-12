import React from "react";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDate } from "@/lib/utils";

export default async function NgoRequestsPage() {
  const user = await requireRole("NGO");
  const ngo = await db.ngo.findUnique({ where: { userId: user.id } });

  const requests = await db.donationRequest.findMany({
    where: { ngoId: ngo?.id },
    include: {
      donation: { include: { provider: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DashboardLayout user={user}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">My Surplus Food Requests</h2>
          <p className="text-xs text-slate-500">Track pending and approved allocation requests</p>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/70 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3">Donation ID</th>
                    <th className="px-6 py-3">Food Item</th>
                    <th className="px-6 py-3">Donor Provider</th>
                    <th className="px-6 py-3">Quantity Requested</th>
                    <th className="px-6 py-3">Reason</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Requested Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                        No food requests submitted yet.
                      </td>
                    </tr>
                  ) : (
                    requests.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-slate-900">{r.donation.humanReadableId}</td>
                        <td className="px-6 py-4 font-semibold text-slate-900">{r.donation.foodName}</td>
                        <td className="px-6 py-4 text-slate-700">{r.donation.provider.organizationName}</td>
                        <td className="px-6 py-4 font-medium text-slate-900">{r.requestedQuantity} {r.donation.unit}</td>
                        <td className="px-6 py-4 text-slate-600 italic max-w-xs truncate">&quot;{r.requestReason}&quot;</td>
                        <td className="px-6 py-4"><StatusBadge status={r.status} /></td>
                        <td className="px-6 py-4 text-slate-400">{formatDate(r.createdAt)}</td>
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
