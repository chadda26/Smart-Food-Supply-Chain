import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { MapPin, Download } from "lucide-react";

export default async function AdminDeliveriesPage() {
  const user = await requireRole("ADMIN");

  const deliveries = await db.delivery.findMany({
    include: {
      donation: { include: { provider: true } },
      distributor: { include: { user: true } },
      ngo: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DashboardLayout user={user}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">System Deliveries & Handoffs</h2>
          <p className="text-xs text-slate-500">Live operational dispatch status across all logistics partners</p>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/70 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3">Task ID</th>
                    <th className="px-6 py-3">Food Item</th>
                    <th className="px-6 py-3">Provider</th>
                    <th className="px-6 py-3">NGO Recipient</th>
                    <th className="px-6 py-3">Driver</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deliveries.map((del) => (
                    <tr key={del.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">{del.donation.humanReadableId}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900">{del.donation.foodName}</td>
                      <td className="px-6 py-4 text-slate-700">{del.donation.provider.organizationName}</td>
                      <td className="px-6 py-4 text-slate-700">{del.ngo.organizationName}</td>
                      <td className="px-6 py-4 text-slate-700">{del.distributor.user.name} ({del.distributor.vehicleType})</td>
                      <td className="px-6 py-4"><StatusBadge status={del.status} /></td>
                      <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                        <Link href={`/admin/tracking?deliveryId=${del.id}`}>
                          <Button variant="outline" size="sm">
                            <MapPin className="w-3.5 h-3.5 mr-1" /> View Map
                          </Button>
                        </Link>
                        <a
                          href={`/api/reports/transit/${del.id}`}
                          download
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Button variant="outline" size="sm" className="text-slate-700 hover:text-emerald-700">
                            <Download className="w-3.5 h-3.5 mr-1 text-emerald-600" /> PDF
                          </Button>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}