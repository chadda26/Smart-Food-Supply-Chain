import React from "react";
import { requireRole } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { NgoWasteClient } from "@/components/waste/NgoWasteClient";
import { getWasteRecords } from "@/services/waste.service";

export default async function NgoWastePage() {
  const user = await requireRole("NGO");
  const records = await getWasteRecords(user);

  return (
    <DashboardLayout user={user}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Warehouse Spoilage & Damaged Food Ledger</h2>
          <p className="text-xs text-slate-500">
            Document post-receipt storage loss, freezer failure, or damaged inventory with circular composting tracking.
          </p>
        </div>

        <NgoWasteClient initialRecords={records} />
      </div>
    </DashboardLayout>
  );
}