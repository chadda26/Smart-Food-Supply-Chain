import React from "react";
import { requireRole } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Shield } from "lucide-react";

export default async function AdminProfilePage() {
  const user = await requireRole("ADMIN");

  return (
    <DashboardLayout user={user}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Administrator Profile</h2>
          <p className="text-xs text-slate-500">Central system authority credentials</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              <CardTitle>{user.name}</CardTitle>
            </div>
            <span className="text-xs font-bold bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full border border-purple-200">
              System Administrator
            </span>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-1">Email</span>
                <span className="font-semibold text-slate-900">{user.email}</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-1">Account Status</span>
                <span className="font-semibold text-emerald-700 font-bold">{user.accountStatus}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}