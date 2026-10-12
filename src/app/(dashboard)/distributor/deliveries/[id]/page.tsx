import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DistributorActionClient } from "./DistributorActionClient";

export default async function DistributorDeliveryActionPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireRole(["DISTRIBUTOR", "ADMIN"]);
  const delivery = await db.delivery.findFirst({
    where: {
      OR: [
        { id: params.id },
        { donationId: params.id },
        { donation: { humanReadableId: params.id } },
      ],
    },
    include: {
      donation: { include: { provider: true } },
      distributor: { include: { user: true } },
      ngo: true,
      pickupVerification: true,
      deliveryVerification: true,
    },
  });

  if (!delivery) notFound();

  return (
    <DashboardLayout user={user}>
      <DistributorActionClient delivery={delivery} user={user} />
    </DashboardLayout>
  );
}