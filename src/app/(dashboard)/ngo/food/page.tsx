import React from "react";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AvailableFoodClient } from "./AvailableFoodClient";

export default async function NgoFoodPage() {
  const user = await requireRole("NGO");
  const ngo = await db.ngo.findUnique({ where: { userId: user.id } });

  const donations = await db.foodDonation.findMany({
    where: {
      status: { in: ["APPROVED", "REQUESTED"] },
      expiryTime: { gt: new Date() },
    },
    include: {
      provider: true,
      requests: { where: { ngoId: ngo?.id } },
    },
    orderBy: { expiryTime: "asc" },
  });

  return (
    <DashboardLayout user={user}>
      <AvailableFoodClient donations={donations} ngo={ngo} />
    </DashboardLayout>
  );
}
