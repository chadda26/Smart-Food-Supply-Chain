import React from "react";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminDonationsClient } from "./AdminDonationsClient";

export default async function AdminDonationsPage() {
  const user = await requireRole("ADMIN");

  const donations = await db.foodDonation.findMany({
    include: {
      provider: true,
      requests: { include: { ngo: true } },
      delivery: { include: { distributor: { include: { user: true } }, ngo: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DashboardLayout user={user}>
      <AdminDonationsClient donations={donations} />
    </DashboardLayout>
  );
}