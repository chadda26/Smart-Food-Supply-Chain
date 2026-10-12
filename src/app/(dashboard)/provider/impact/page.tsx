import React from "react";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { getProviderImpactMetrics } from "@/services/impact.service";
import { Heart, Leaf, Award, Droplets, Package, DollarSign, ShieldCheck } from "lucide-react";

export default async function ProviderImpactPage() {
  const user = await requireRole("FOOD_PROVIDER");
  const provider = await db.foodProvider.findUnique({
    where: { userId: user.id },
  });

  const impact = provider ? await getProviderImpactMetrics(provider.id) : null;

  const diversionEfficiency =
    impact && impact.totalKgDonated > 0
      ? Math.round((impact.totalKgRescued / impact.totalKgDonated) * 100)
      : 0;

  return (
    <DashboardLayout user={user}>
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Food Provider ESG & Social Impact Analysis</h2>
          <p className="text-xs text-slate-500 mt-1">
            Verifiable environmental offsets and community meals generated from your surplus food donations
          </p>
        </div>

        {/* Primary Impact Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="p-5 border-blue-100 bg-blue-50/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-800">Meals Served</span>
              <Heart className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-black text-slate-900 mt-3">{impact?.mealsServed || 0}</p>
            <span className="text-xs text-slate-500 mt-1 block">Nutritious meals provided</span>
          </Card>

          <Card className="p-5 border-emerald-100 bg-emerald-50/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800">Surplus Rescued</span>
              <Leaf className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-3xl font-black text-slate-900 mt-3">{impact?.totalKgRescued || 0} kg</p>
            <span className="text-xs text-slate-500 mt-1 block">Delivered to verified NGOs</span>
          </Card>

          <Card className="p-5 border-amber-100 bg-amber-50/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800">CO2e Averted</span>
              <Award className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-3xl font-black text-slate-900 mt-3">{impact?.co2SavedKg || 0} kg</p>
            <span className="text-xs text-slate-500 mt-1 block">Greenhouse emissions avoided</span>
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

        {/* Secondary Detailed Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-100 rounded-xl text-slate-700">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium">Total Food Donated</span>
                <p className="text-xl font-bold text-slate-900">{impact?.totalKgDonated || 0} kg</p>
                <span className="text-[11px] text-slate-400 font-medium">
                  {impact?.totalDonations || 0} batches registered
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium">Diversion Efficiency</span>
                <p className="text-xl font-bold text-emerald-600">{diversionEfficiency}%</p>
                <span className="text-[11px] text-slate-400 font-medium">
                  {impact?.completedDonations || 0} completed rescues
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-50 rounded-xl text-green-600">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium">Estimated Value Preserved</span>
                <p className="text-xl font-bold text-green-600">${impact?.financialValueSavedUsd || 0}</p>
                <span className="text-[11px] text-slate-400 font-medium">Economic value saved</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}