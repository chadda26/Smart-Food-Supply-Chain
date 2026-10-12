import React from "react";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

export default async function AdminDistributorsPage() {
  const user = await requireRole("ADMIN");
  const distributors = await db.distributor.findMany({
    include: { user: true, deliveries: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DashboardLayout user={user}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Distributor Logistics Fleet</h2>
          <p className="text-xs text-slate-500">Delivery partners, volunteer drivers, and vehicle capabilities</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {distributors.map((d) => (
            <Card key={d.id} className="p-5">
              <h3 className="font-bold text-slate-900 text-sm">{d.user.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Vehicle: {d.vehicleType} &bull; Rating: {d.reliabilityScore.toFixed(1)}★</p>
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                <p>Email: {d.user.email}</p>
                <p>Phone: {d.user.phone || "Not set"}</p>
                <p>Total Deliveries: <b>{d.totalDeliveries}</b></p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}