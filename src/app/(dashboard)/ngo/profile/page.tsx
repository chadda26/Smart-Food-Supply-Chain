import React from "react";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { HeartHandshake } from "lucide-react";

export default async function NgoProfilePage() {
  const user = await requireRole("NGO");
  const ngo = await db.ngo.findUnique({ where: { userId: user.id } });

  return (
    <DashboardLayout user={user}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">NGO Organization Profile</h2>
          <p className="text-xs text-slate-500">Your verified distribution facility and capacity parameters</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-emerald-600" />
              <CardTitle>{ngo?.organizationName || user.name}</CardTitle>
            </div>
            <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
              {ngo?.verificationStatus || "VERIFIED"}
            </span>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-1">Storage Capacity</span>
                <span className="font-semibold text-slate-900">{ngo?.foodCapacity || 250} kg</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-1">Availability Status</span>
                <span className="font-semibold text-slate-900">{ngo?.availabilityStatus || "AVAILABLE"}</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-1">Email</span>
                <span className="font-semibold text-slate-900">{user.email}</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-1">Phone</span>
                <span className="font-semibold text-slate-900">{user.phone || "Not set"}</span>
              </div>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block mb-1">Facility Address</span>
              <span className="font-semibold text-slate-900">{ngo?.address}, {ngo?.city}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}