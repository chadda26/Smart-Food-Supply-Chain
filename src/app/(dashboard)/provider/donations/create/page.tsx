import React from "react";
import { requireRole } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CreateDonationClient } from "@/components/donation/CreateDonationClient";

export default async function CreateDonationPage() {
  const user = await requireRole("FOOD_PROVIDER");

  return (
    <DashboardLayout user={user}>
      <CreateDonationClient />
    </DashboardLayout>
  );
}