import React from "react";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

export default async function AdminProvidersPage() {
  const user = await requireRole("ADMIN");
  const providers = await db.foodProvider.findMany({
    include: { user: true, donations: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DashboardLayout user={user}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Food Providers Directory</h2>
          <p className="text-xs text-slate-500">Verified commercial kitchens, hotels, and food suppliers</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {providers.map((p) => (
            <Card key={p.id} className="p-5">
              <h3 className="font-bold text-slate-900 text-sm">{p.organizationName}</h3>
              <p className="text-xs text-slate-500 mt-0.5 capitalize">{p.organizationType.toLowerCase()} &bull; {p.city}</p>
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                <p>Contact: <b>{p.user.name}</b> ({p.user.email})</p>
                <p>Address: {p.address}</p>
                <p>Total Batches: <b>{p.donations.length}</b></p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}