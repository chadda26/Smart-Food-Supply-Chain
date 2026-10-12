import React from "react";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";
import { Bell } from "lucide-react";

export default async function NgoNotificationsPage() {
  const user = await requireRole("NGO");
  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DashboardLayout user={user}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Notifications & Delivery Alerts</h2>
          <p className="text-xs text-slate-500">Real-time dispatches, driver approaching alerts, and food allocation updates</p>
        </div>

        <Card>
          <CardContent className="divide-y divide-slate-100 p-0">
            {notifications.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No notifications received yet.
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="p-5 flex items-start gap-4 hover:bg-slate-50 transition-colors text-xs">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900">{n.title}</h4>
                      <span className="text-[10px] text-slate-400">{formatDate(n.createdAt)}</span>
                    </div>
                    <p className="text-slate-600 mt-1">{n.message}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}