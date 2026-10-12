import React from "react";
import { requireRole } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProviderWasteClient } from "@/components/waste/ProviderWasteClient";
import { getWasteRecords } from "@/services/waste.service";

export default async function ProviderWastePage() {
  const user = await requireRole("FOOD_PROVIDER");
  const records = await getWasteRecords(user);

  return (
    <DashboardLayout user={user}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Food Loss & Kitchen Waste Audit</h2>
          <p className="text-xs text-slate-500">
            Document kitchen preparation scrap, thermal abuse, or expired surplus with verifiable disposal tracking.
          </p>
        </div>

        <ProviderWasteClient initialRecords={records} />
      </div>
    </DashboardLayout>
  );
}