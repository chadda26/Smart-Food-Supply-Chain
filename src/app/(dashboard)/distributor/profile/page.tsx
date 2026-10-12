import React from "react";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DistributorProfileClient } from "@/components/distributor/DistributorProfileClient";

export default async function DistributorProfilePage() {
  const user = await requireRole("DISTRIBUTOR");
  const [distributor, dbUser] = await Promise.all([
    db.distributor.findUnique({ where: { userId: user.id } }),
    db.user.findUnique({ where: { id: user.id }, select: { id: true, name: true, email: true, role: true, phone: true, avatarUrl: true } }),
  ]);

  return (
    <DashboardLayout user={user}>
      <DistributorProfileClient
        user={{
          id: user.id,
          name: dbUser?.name || user.name,
          email: dbUser?.email || user.email,
          role: user.role,
          phone: dbUser?.phone,
          avatarUrl: dbUser?.avatarUrl,
        }}
        distributor={distributor}
      />
    </DashboardLayout>
  );
}