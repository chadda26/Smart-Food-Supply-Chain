import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getComprehensiveAdminAnalytics } from "@/services/analytics.service";
import { FileText, Download, Table, Leaf, ShieldCheck, CheckCircle2 } from "lucide-react";

export default async function AdminReportsPage() {
  const user = await requireRole("ADMIN");
  const analytics = await getComprehensiveAdminAnalytics({ range: "all" });

  return (
    <DashboardLayout user={user}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">System Compliance & Impact Reports</h2>
          <p className="text-xs text-slate-500">Generate and export supply chain compliance, audit ledgers, and sustainability documentation</p>
        </div>

        {/* Overview Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4">
            <span className="text-[11px] font-semibold text-slate-500 block">Total Rescued Volume</span>
            <p className="text-xl font-bold text-emerald-600 mt-1">{analytics.donations.totalRescuedKg} kg</p>
          </Card>
          <Card className="p-4">
            <span className="text-[11px] font-semibold text-slate-500 block">Meals Provided</span>
            <p className="text-xl font-bold text-blue-600 mt-1">{analytics.impact.mealsServed}</p>
          </Card>
          <Card className="p-4">
            <span className="text-[11px] font-semibold text-slate-500 block">Verified Deliveries</span>
            <p className="text-xl font-bold text-slate-900 mt-1">{analytics.logistics.completedDeliveries}</p>
          </Card>
          <Card className="p-4">
            <span className="text-[11px] font-semibold text-slate-500 block">Active Network</span>
            <p className="text-xl font-bold text-purple-600 mt-1">{analytics.overview.totalProviders + analytics.overview.totalNgos} Orgs</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* CSV Export Card */}
          <Card className="p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                  <Table className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Comprehensive Supply Chain CSV</h3>
                  <p className="text-xs text-slate-500">Complete batch export with donors, drivers, NGOs, and ESG metrics</p>
                </div>
              </div>
              <div className="mt-4 text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p>&bull; <b>{analytics.donations.totalCount}</b> Food Donation Batches</p>
                <p>&bull; <b>{analytics.logistics.completedDeliveries}</b> Completed Logistics Tasks</p>
                <p>&bull; Includes full timestamp ledger and GPS verification statuses</p>
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <a href="/api/reports/summary/csv" download>
                <Button variant="success" size="sm">
                  <Download className="w-3.5 h-3.5 mr-1" /> Export CSV Report
                </Button>
              </a>
            </div>
          </Card>

          {/* Traceability & Individual PDF Link Card */}
          <Card className="p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Chain of Custody PDF Reports</h3>
                  <p className="text-xs text-slate-500">Verified vector A4 PDFs with driver photo proof and ESG scorecard</p>
                </div>
              </div>
              <div className="mt-4 text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p>&bull; Access individual verified handoff certificates</p>
                <p>&bull; Driver loading photos and temperature compliance</p>
                <p>&bull; Immutable audit ledger with cryptographic verification</p>
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <Link href="/admin/deliveries">
                <Button variant="outline" size="sm">
                  <FileText className="w-3.5 h-3.5 mr-1" /> View Deliveries List
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}