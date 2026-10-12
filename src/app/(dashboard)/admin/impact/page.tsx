import React from "react";
import { requireRole } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { getGlobalImpactMetrics } from "@/services/impact.service";
import { Leaf, Award, Heart, Droplets, DollarSign, Users } from "lucide-react";

export default async function AdminImpactPage() {
  const user = await requireRole("ADMIN");
  const impact = await getGlobalImpactMetrics();

  return (
    <DashboardLayout user={user}>
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Global ESG Sustainability & Impact Dashboard</h2>
          <p className="text-xs text-slate-500 mt-1">Platform-wide verified environmental reduction metrics and community nutrition delivered</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6 bg-emerald-50/50 border-emerald-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900">Total Food Saved</span>
              <Leaf className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-4xl font-black text-slate-900 mt-3">{impact.totalFoodSavedKg} kg</p>
            <span className="text-xs text-slate-500 mt-1 block">Diverted from waste streams</span>
          </Card>

          <Card className="p-6 bg-blue-50/50 border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900">Meals Delivered</span>
              <Heart className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-4xl font-black text-slate-900 mt-3">{impact.mealsServed}</p>
            <span className="text-xs text-slate-500 mt-1 block">Community nutrition provided</span>
          </Card>

          <Card className="p-6 bg-amber-50/50 border-amber-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900">CO₂e Emissions Prevented</span>
              <Award className="w-6 h-6 text-amber-600" />
            </div>
            <p className="text-4xl font-black text-slate-900 mt-3">{impact.co2SavedKg} kg</p>
            <span className="text-xs text-slate-500 mt-1 block">EPA WARM equivalent offset</span>
          </Card>

          <Card className="p-6 bg-cyan-50/50 border-cyan-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-900">Embedded Water Saved</span>
              <Droplets className="w-6 h-6 text-cyan-600" />
            </div>
            <p className="text-4xl font-black text-slate-900 mt-3">{impact.waterSavedLiters} L</p>
            <span className="text-xs text-slate-500 mt-1 block">Water footprint conserved</span>
          </Card>

          <Card className="p-6 bg-purple-50/50 border-purple-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-900">Economic Value Saved</span>
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-4xl font-black text-slate-900 mt-3">${impact.financialValueSavedUsd.toFixed(2)}</p>
            <span className="text-xs text-slate-500 mt-1 block">Commercial food value rescued</span>
          </Card>

          <Card className="p-6 bg-slate-100 border-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Active Network</span>
              <Users className="w-6 h-6 text-slate-700" />
            </div>
            <p className="text-4xl font-black text-slate-900 mt-3">{impact.ngosServedCount} NGOs</p>
            <span className="text-xs text-slate-500 mt-1 block">Across {impact.providersActiveCount} verified providers</span>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}