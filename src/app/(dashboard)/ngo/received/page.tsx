import React from "react";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ReceivedFoodClient } from "./ReceivedFoodClient";

export default async function NgoReceivedPage() {
  const user = await requireRole("NGO");
  const ngo = await db.ngo.findUnique({ where: { userId: user.id } });

  const deliveries = await db.delivery.findMany({
    where: { ngoId: ngo?.id },
    include: {
      donation: { include: { provider: true } },
      distributor: { include: { user: true } },
      deliveryVerification: true,
      feedback: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DashboardLayout user={user}>
      <ReceivedFoodClient deliveries={deliveries} />
    </DashboardLayout>
  );
}