import React from "react";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";

export default async function AdminAuditLogsPage() {
  const user = await requireRole("ADMIN");

  const logs = await db.auditLog.findMany({
    include: { user: true },
    orderBy: { timestamp: "desc" },
    take: 100,
  });

  return (
    <DashboardLayout user={user}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Compliance & Security Audit Trail</h2>
          <p className="text-xs text-slate-500">Immutable ledger of state transitions, verifications, and user actions</p>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/70 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3">Timestamp</th>
                    <th className="px-6 py-3">Action</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">User</th>
                    <th className="px-6 py-3">Entity</th>
                    <th className="px-6 py-3">Entity ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3.5 text-slate-500">{formatDate(log.timestamp)}</td>
                      <td className="px-6 py-3.5 font-bold text-slate-900">{log.action}</td>
                      <td className="px-6 py-3.5 text-slate-600">{log.actorRole}</td>
                      <td className="px-6 py-3.5 text-slate-700 font-sans">{log.user?.name || "System"}</td>
                      <td className="px-6 py-3.5 text-slate-600">{log.entity}</td>
                      <td className="px-6 py-3.5 text-slate-400 truncate max-w-[120px]">{log.entityId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}