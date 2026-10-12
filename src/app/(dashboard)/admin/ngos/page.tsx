import React from "react";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

export default async function AdminNgosPage() {
  const user = await requireRole("ADMIN");
  const ngos = await db.ngo.findMany({
    include: { user: true, requests: true, deliveries: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DashboardLayout user={user}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">NGOs & Food Banks Directory</h2>
          <p className="text-xs text-slate-500">Registered community relief and distribution facilities</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {ngos.map((ngo) => (
            <Card key={ngo.id} className="p-5">
              <h3 className="font-bold text-slate-900 text-sm">{ngo.organizationName}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Capacity: {ngo.foodCapacity} kg &bull; Status: {ngo.availabilityStatus}</p>
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                <p>Contact: <b>{ngo.user.name}</b> ({ngo.user.email})</p>
                <p>Address: {ngo.address}, {ngo.city}</p>
                <p>Completed Deliveries: <b>{ngo.deliveries.filter(d => d.status === 'COMPLETED').length}</b></p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}