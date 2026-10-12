import React from "react";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { HeartHandshake, MapPin, Award } from "lucide-react";

export default async function ProviderMatchingPage() {
  const user = await requireRole("FOOD_PROVIDER");
  const provider = await db.foodProvider.findUnique({ where: { userId: user.id } });

  const ngos = await db.ngo.findMany({
    where: { verificationStatus: "VERIFIED" },
    orderBy: { foodCapacity: "desc" },
  });

  return (
    <DashboardLayout user={user}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Partner NGOs & Food Banks Network</h2>
          <p className="text-xs text-slate-500">Verified community organizations ready to receive surplus food in your area</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {ngos.map((ngo) => (
            <Card key={ngo.id} className="p-5 hover:border-emerald-300 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{ngo.organizationName}</h3>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {ngo.address}, {ngo.city}
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200">
                  {ngo.availabilityStatus}
                </span>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>Storage Capacity: <b>{ngo.foodCapacity} kg</b></span>
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" /> Verified Partner
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
