import React from "react";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";

export default async function AdminUsersPage() {
  const user = await requireRole("ADMIN");
  const users = await db.user.findMany({
    include: { foodProvider: true, ngo: true, distributor: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DashboardLayout user={user}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">User Management Directory</h2>
          <p className="text-xs text-slate-500">Registered platform participants across all system roles</p>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/70 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Affiliation / Org</th>
                    <th className="px-6 py-3">Account Status</th>
                    <th className="px-6 py-3">Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => {
                    let org = "-";
                    if (u.foodProvider) org = u.foodProvider.organizationName;
                    else if (u.ngo) org = u.ngo.organizationName;
                    else if (u.distributor) org = `Vehicle: ${u.distributor.vehicleType}`;

                    return (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">{u.name}</td>
                        <td className="px-6 py-4 text-slate-600">{u.email}</td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                            {u.role.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-700">{org}</td>
                        <td className="px-6 py-4">
                          <span className="text-emerald-700 font-bold text-[11px]">{u.accountStatus}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-400">{formatDate(u.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}