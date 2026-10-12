import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { MapPin, Truck, Download } from "lucide-react";

export default async function NgoDeliveriesPage() {
  const user = await requireRole("NGO");
  const ngo = await db.ngo.findUnique({ where: { userId: user.id } });

  const deliveries = await db.delivery.findMany({
    where: { ngoId: ngo?.id },
    include: {
      donation: { include: { provider: true } },
      distributor: { include: { user: true } },
      deliveryVerification: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DashboardLayout user={user}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Incoming Deliveries & Handoffs</h2>
          <p className="text-xs text-slate-500">Live GPS tracking and double-verification handoff confirmations</p>
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
                    <th className="px-6 py-3">Assigned Driver</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deliveries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        No active or past incoming deliveries.
                      </td>
                    </tr>
                  ) : (
                    deliveries.map((del) => (
                      <tr key={del.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-slate-900">{del.donation.humanReadableId}</td>
                        <td className="px-6 py-4 font-semibold text-slate-900">{del.donation.foodName}</td>
                        <td className="px-6 py-4 text-slate-700">{del.donation.provider.organizationName}</td>
                        <td className="px-6 py-4 text-slate-700">
                          <div className="flex items-center gap-2.5">
                            {del.distributor.user.avatarUrl ? (
                              <img
                                src={del.distributor.user.avatarUrl}
                                alt={del.distributor.user.name}
                                className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] border border-emerald-200 shrink-0">
                                {del.distributor.user.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <span className="font-semibold text-slate-900 block">{del.distributor.user.name}</span>
                              <span className="text-[10px] text-slate-500 block capitalize">{del.distributor.vehicleType.toLowerCase()}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4"><StatusBadge status={del.status} /></td>
                        <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                          <Link href={`/ngo/deliveries/${del.id}/track`}>
                            <Button variant="primary" size="sm">
                              <MapPin className="w-3.5 h-3.5 mr-1" /> Track GPS
                            </Button>
                          </Link>
                          {["IN_TRANSIT", "DELIVERED", "PICKED_UP"].includes(del.status) && !del.deliveryVerification && (
                            <Link href="/ngo/received">
                              <Button variant="success" size="sm">
                                Confirm Receipt
                              </Button>
                            </Link>
                          )}
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