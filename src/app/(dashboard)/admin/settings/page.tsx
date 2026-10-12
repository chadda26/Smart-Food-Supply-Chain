import React from "react";
import { requireRole } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default async function AdminSettingsPage() {
  const user = await requireRole("ADMIN");

  return (
    <DashboardLayout user={user}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Platform & Matching Parameters</h2>
          <p className="text-xs text-slate-500">System parameters for algorithmic NGO matching and safety thresholds</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Matching Engine Constants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Max Matching Proximity (km)" defaultValue="25" />
              <Input label="Urgent Expiry Horizon (Hours)" defaultValue="6" />
              <Input label="Default Driver Speed (km/h)" defaultValue="25" />
              <Input label="Max GPS Ping Retention (Hours)" defaultValue="2" />
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button variant="primary" size="sm">Save Configuration</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}