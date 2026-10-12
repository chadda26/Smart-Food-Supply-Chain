import React from "react";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { getNgoImpactMetrics } from "@/services/impact.service";
import { Heart, Leaf, Award, Droplets } from "lucide-react";

export default async function NgoImpactPage() {
  const user = await requireRole("NGO");
  const ngo = await db.ngo.findUnique({ where: { userId: user.id } });
  const impact = ngo ? await getNgoImpactMetrics(ngo.id) : null;

  return (
    <DashboardLayout user={user}>
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Community Social & Environmental Impact</h2>
          <p className="text-xs text-slate-500 mt-1">Impact generated through your organization's surplus food rescue operations</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="p-5 border-blue-100 bg-blue-50/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-800">Meals Distributed</span>
              <Heart className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-black text-slate-900 mt-3">{impact?.mealsServed || 0}</p>
            <span className="text-xs text-slate-500 mt-1 block">Beneficiaries supported</span>
          </Card>

          <Card className="p-5 border-emerald-100 bg-emerald-50/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800">Surplus Food Rescued</span>
              <Leaf className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-3xl font-black text-slate-900 mt-3">{impact?.totalKgReceived || 0} kg</p>
            <span className="text-xs text-slate-500 mt-1 block">Prevented from decay</span>
          </Card>

          <Card className="p-5 border-amber-100 bg-amber-50/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800">CO2e Averted</span>
              <Award className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-3xl font-black text-slate-900 mt-3">{impact?.co2SavedKg || 0} kg</p>
            <span className="text-xs text-slate-500 mt-1 block">Greenhouse offset</span>
          </Card>

          <Card className="p-5 border-cyan-100 bg-cyan-50/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-800">Water Conserved</span>
              <Droplets className="w-5 h-5 text-cyan-600" />
            </div>
            <p className="text-3xl font-black text-slate-900 mt-3">{impact?.waterSavedLiters || 0} L</p>
            <span className="text-xs text-slate-500 mt-1 block">Embedded water saved</span>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}