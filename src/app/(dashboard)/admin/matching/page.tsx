import React from "react";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminMatchingClient } from "./AdminMatchingClient";

export default async function AdminMatchingPage() {
  const user = await requireRole("ADMIN");

  const donations = await db.foodDonation.findMany({
    where: { status: { in: ["APPROVED", "REQUESTED"] } },
    include: {
      provider: true,
      requests: { include: { ngo: true } },
    },
    orderBy: { expiryTime: "asc" },
  });

  const distributors = await db.distributor.findMany({
    include: { user: true },
  });

  const ngos = await db.ngo.findMany({
    where: { verificationStatus: "VERIFIED" },
  });

  return (
    <DashboardLayout user={user}>
      <AdminMatchingClient donations={donations} distributors={distributors} ngos={ngos} />
    </DashboardLayout>
  );
}