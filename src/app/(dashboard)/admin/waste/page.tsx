import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getWasteRecords, getWasteStats } from "@/services/waste.service";
import {
  AlertTriangle,
  Download,
  Trash2,
  Recycle,
  Building2,
  Truck,
  HeartHandshake,
  FileText,
  Calendar,
  Filter,
  Image as ImageIcon,
} from "lucide-react";

export default async function AdminWasteLedgerPage({
  searchParams,
}: {
  searchParams?: { reason?: string; disposalMethod?: string; stage?: string; search?: string };
}) {
  const user = await requireRole("ADMIN");

  const [records, stats] = await Promise.all([
    getWasteRecords(user, searchParams),
    getWasteStats(user),
  ]);

  const reasonFilters = [
    { label: "All Reasons", value: "ALL" },
    { label: "Expired", value: "EXPIRED_BEFORE_PICKUP" },
    { label: "Spoiled in Storage", value: "SPOILED_IN_STORAGE" },
    { label: "Damaged in Transit", value: "DAMAGED_IN_TRANSIT" },
    { label: "Cold Chain Failure", value: "COLD_CHAIN_FAILURE" },
    { label: "Contaminated", value: "CONTAMINATED" },
    { label: "Rejected at Delivery", value: "REJECTED_AT_DELIVERY" },
  ];

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header Banner */}
        <div className="flex items-center justify-between flex-wrap gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-rose-950 rounded-2xl p-6 text-white shadow-md">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-rose-500/20 text-rose-300 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Food Waste & Spoilage Ledger
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight mt-1">Loss Management & Circular Disposal</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Immutable audit ledger for recorded kitchen scraps, transit damages, thermal abuse, and secondary circular disposal (composting, animal feed, bio-gas).
            </p>
          </div>

          <div className="flex gap-3">
            <a href="/api/reports/waste/csv" download>
              <Button variant="outline" size="md" className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
                <Download className="w-4 h-4 mr-1.5" /> Export Waste CSV
              </Button>
            </a>
          </div>
        </div>

        {/* Stats KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 border-rose-100 bg-rose-50/20">
            <span className="text-[11px] font-semibold text-slate-500 block">Total Waste Documented</span>
            <p className="text-2xl font-bold text-rose-600 mt-1">{stats.totalWastedKg} kg</p>
            <span className="text-[10px] text-slate-400 mt-0.5 block">{stats.totalRecords} Incident Records</span>
          </Card>

          <Card className="p-4 border-emerald-100 bg-emerald-50/20">
            <span className="text-[11px] font-semibold text-slate-500 block">Composted & Recycled</span>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.compostedKg} kg</p>
            <span className="text-[10px] text-emerald-700 font-medium mt-0.5 block">{stats.compostOrRecycledPercent}% Circularity</span>
          </Card>

          <Card className="p-4 border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 block">Landfill Discard</span>
            <p className="text-2xl font-bold text-slate-800 mt-1">{stats.landfillKg} kg</p>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Zero-energy disposal</span>
          </Card>

          <Card className="p-4 border-blue-100 bg-blue-50/20">
            <span className="text-[11px] font-semibold text-slate-500 block">Circularity Index</span>
            <p className="text-2xl font-bold text-blue-600 mt-1">{stats.compostOrRecycledPercent}%</p>
            <span className="text-[10px] text-blue-600 mt-0.5 block">Diverted from Landfill</span>
          </Card>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-rose-600" />
            <span className="text-xs font-bold text-slate-800">Filter Waste Reason:</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {reasonFilters.map((opt) => {
              const isActive = (searchParams?.reason || "ALL") === opt.value;
              return (
                <Link key={opt.value} href={`/admin/waste?reason=${opt.value}`}>
                  <Button
                    variant={isActive ? "primary" : "outline"}
                    size="sm"
                    className={isActive ? "font-bold text-xs" : "text-xs text-slate-600 hover:text-slate-900"}
                  >
                    {opt.label}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Waste Records Table */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Recorded Waste & Spoilage Incidents ({records.length})</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Chronological record of verified discards with evidence proof</p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/70 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3">Waste ID</th>
                    <th className="px-5 py-3">Food Item</th>
                    <th className="px-5 py-3">Quantity</th>
                    <th className="px-5 py-3">Reason</th>
                    <th className="px-5 py-3">Disposal Method</th>
                    <th className="px-5 py-3">Stage & Source</th>
                    <th className="px-5 py-3">Recorded At</th>
                    <th className="px-5 py-3 text-right">Evidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center">
                          <Recycle className="w-8 h-8 text-slate-300 mb-2" />
                          <p className="font-semibold text-slate-600">No Food Waste Records Logged</p>
                          <span className="text-[11px] text-slate-400 mt-0.5">
                            Food waste documented by donors, drivers, or NGOs will be displayed in this ledger.
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    records.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5 font-mono font-bold text-slate-900">{r.humanReadableId}</td>
                        <td className="px-5 py-3.5 font-semibold text-slate-900">
                          {r.foodName}
                          <span className="text-[10px] text-slate-400 block font-normal">{r.foodCategory}</span>
                        </td>
                        <td className="px-5 py-3.5 font-bold text-rose-600">
                          {r.quantityWasted} {r.unit}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 bg-rose-50 text-rose-700 font-semibold text-[10px] rounded border border-rose-100">
                            {r.reason.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-semibold text-[10px] rounded border border-emerald-100">
                            {r.disposalMethod.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">
                          <span className="font-medium text-slate-900">{r.stage}</span>
                          <span className="text-[10px] text-slate-400 block">
                            By {r.recordedRole} {r.donation?.provider?.organizationName ? `(${r.donation.provider.organizationName})` : ""}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px]">
                          {new Date(r.recordedAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {r.photoUrl ? (
                            <a
                              href={r.photoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline"
                            >
                              <ImageIcon className="w-3.5 h-3.5" /> View Photo
                            </a>
                          ) : (
                            <span className="text-slate-400 text-[11px]">No Photo</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}