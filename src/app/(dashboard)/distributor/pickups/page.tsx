import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDate } from "@/lib/utils";
import { Package, ArrowRight, MapPin } from "lucide-react";

export default async function DistributorPickupsPage() {
  const user = await requireRole("DISTRIBUTOR");
  const distributor = await db.distributor.findUnique({ where: { userId: user.id } });

  const tasks = await db.delivery.findMany({
    where: {
      distributorId: distributor?.id,
      status: { in: ["ASSIGNED", "PICKUP_IN_PROGRESS"] },
    },
    include: {
      donation: { include: { provider: true } },
      ngo: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DashboardLayout user={user}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Assigned Food Pickup Tasks</h2>
          <p className="text-xs text-slate-500">Collect surplus food from kitchens, inspect condition, and verify pickup</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {tasks.length === 0 ? (
            <Card className="p-12 text-center text-slate-400 text-xs">
              No pickup tasks assigned right now. You will receive a notification when a new task is dispatched.
            </Card>
          ) : (
            tasks.map((task) => (
              <Card key={task.id} className="p-5 hover:border-emerald-300 transition-all">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {task.donation.humanReadableId}
                      </span>
                      <StatusBadge status={task.status} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{task.donation.foodName}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {task.donation.quantity} {task.donation.unit} &bull; Category: {task.donation.foodCategory.toLowerCase()}
                    </p>
                  </div>

                  <Link href={`/distributor/deliveries/${task.id}`}>
                    <Button variant="primary" size="sm">
                      Inspect & Verify Pickup &rarr;
                    </Button>
                  </Link>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-800 block">Pickup from Provider:</span>
                      <span>{task.donation.provider.organizationName} - {task.donation.provider.address}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-800 block">Delivery Destination:</span>
                      <span>{task.ngo.organizationName} - {task.ngo.address}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}