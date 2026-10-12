import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { CategoryPieChart, FoodSavedTrendChart } from "@/components/charts/ImpactCharts";
import { getComprehensiveAdminAnalytics, DateRangeFilter } from "@/services/analytics.service";
import {
  Users,
  Building2,
  HeartHandshake,
  Truck,
  Package,
  CheckCircle2,
  Leaf,
  Shield,
  ArrowRight,
  MapPin,
  Clock,
  AlertTriangle,
  Flame,
  Calendar,
  Layers,
  Award,
} from "lucide-react";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams?: { range?: string; from?: string; to?: string };
}) {
  const user = await requireRole("ADMIN");

  const selectedRange = (searchParams?.range || "all") as DateRangeFilter;
  const customFrom = searchParams?.from ? new Date(searchParams.from) : undefined;
  const customTo = searchParams?.to ? new Date(searchParams.to) : undefined;

  // Query comprehensive real-time database analytics
  const analytics = await getComprehensiveAdminAnalytics({
    range: selectedRange,
    from: customFrom && !isNaN(customFrom.getTime()) ? customFrom : undefined,
    to: customTo && !isNaN(customTo.getTime()) ? customTo : undefined,
  });

  // Recent operational items
  const [pendingApprovalCount, recentDonations, recentLogs] = await Promise.all([
    db.foodDonation.count({ where: { status: "SUBMITTED" } }),
    db.foodDonation.findMany({
      include: { provider: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    db.auditLog.findMany({
      take: 6,
      orderBy: { timestamp: "desc" },
    }),
  ]);

  const dateFilterOptions = [
    { label: "Last 7 Days", value: "7d" },
    { label: "Last 30 Days", value: "30d" },
    { label: "Last 90 Days", value: "90d" },
    { label: "All Time", value: "all" },
  ];

  return (
    <DashboardLayout user={user}>
      {/* Header Banner */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-6 text-white shadow-md">
        <div>
          <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider block">
            System Administration & Central Dispatch
          </span>
          <h2 className="text-2xl font-bold tracking-tight mt-1">Platform Control Center</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Real-time oversight of food provider submissions, multi-factor NGO matching, logistics dispatch, and verified ESG impact metrics.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/donations">
            <Button variant="success" size="md">
              Review Donations ({pendingApprovalCount})
            </Button>
          </Link>
          <Link href="/admin/tracking">
            <Button variant="outline" size="md" className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
              <MapPin className="w-4 h-4 mr-1.5" /> Fleet Live Map
            </Button>
          </Link>
        </div>
      </div>

      {/* Date Range Filtering Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-slate-800">Analytics Timeframe:</span>
          {analytics.dateRange.startDate && (
            <span className="text-[11px] text-slate-500 font-mono">
              ({new Date(analytics.dateRange.startDate).toLocaleDateString()} - {analytics.dateRange.endDate ? new Date(analytics.dateRange.endDate).toLocaleDateString() : "Now"})
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {dateFilterOptions.map((opt) => {
            const isActive = selectedRange === opt.value;
            return (
              <Link key={opt.value} href={`/admin?range=${opt.value}`}>
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

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold block">Total Users</span>
            <Users className="w-3.5 h-3.5" />
          </div>
          <p className="text-xl font-bold text-slate-900 mt-1">{analytics.overview.totalUsers}</p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">{analytics.overview.totalProviders} Donors &bull; {analytics.overview.totalNgos} NGOs</span>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold block">Active Donors</span>
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <p className="text-xl font-bold text-slate-900 mt-1">{analytics.overview.totalProviders}</p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Verified kitchens</span>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold block">Verified NGOs</span>
            <HeartHandshake className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <p className="text-xl font-bold text-slate-900 mt-1">{analytics.overview.totalNgos}</p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Distribution hubs</span>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold block">Distributors</span>
            <Truck className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <p className="text-xl font-bold text-slate-900 mt-1">{analytics.overview.totalDistributors}</p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Active fleet vehicles</span>
        </Card>

        <Card className="p-4 border-emerald-100 bg-emerald-50/30">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-[11px] font-semibold block">Food Rescued</span>
            <Leaf className="w-3.5 h-3.5" />
          </div>
          <p className="text-xl font-bold text-emerald-700 mt-1">{analytics.donations.totalRescuedKg} kg</p>
          <span className="text-[10px] text-emerald-600 font-medium mt-0.5 block">{analytics.donations.diversionEfficiencyPercent}% Diversion Rate</span>
        </Card>

        <Card className="p-4 border-blue-100 bg-blue-50/30">
          <div className="flex items-center justify-between text-blue-700">
            <span className="text-[11px] font-semibold block">Meals Provided</span>
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <p className="text-xl font-bold text-blue-700 mt-1">{analytics.impact.mealsServed}</p>
          <span className="text-[10px] text-blue-600 font-medium mt-0.5 block">Social nutrition impact</span>
        </Card>
      </div>

      {/* Analytics Charts (100% Dynamic Database-Backed) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Monthly Rescued Food Growth (kg)</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Chronological comparison of registered vs completed rescued food batches</p>
            </div>
          </CardHeader>
          <CardContent>
            <FoodSavedTrendChart data={analytics.monthlyTrend} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Food Category Distribution</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Volume breakdown by perishable food category in selected timeframe</p>
            </div>
          </CardHeader>
          <CardContent>
            <CategoryPieChart data={analytics.donations.categories} />
          </CardContent>
        </Card>
      </div>

      {/* Logistics, Supply Chain & Waste Analytics Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Logistics Performance Card */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Truck className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Logistics & Transit KPIs</h3>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              {analytics.logistics.totalDeliveries} Tasks
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Completed Deliveries</span>
              <span className="font-bold text-slate-900">{analytics.logistics.completedDeliveries}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Active / En Route</span>
              <span className="font-bold text-emerald-600">{analytics.logistics.activeDeliveries}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Disputed Handoffs</span>
              <span className="font-bold text-rose-600">{analytics.logistics.disputedDeliveries}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Avg Transit Time
              </span>
              <span className="font-bold text-slate-900">
                {analytics.logistics.averageTransitMinutes !== null ? `${analytics.logistics.averageTransitMinutes} mins` : "N/A"}
              </span>
            </div>
          </div>
        </Card>

        {/* Donation Lifecycle Funnel */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Donation Lifecycle</h3>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              {analytics.donations.totalCount} Total
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Approved & Allocated</span>
              <span className="font-bold text-blue-600">{analytics.donations.approvedCount}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Pending Review</span>
              <span className="font-bold text-amber-600">{analytics.donations.pendingCount}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Successfully Delivered</span>
              <span className="font-bold text-emerald-600">{analytics.donations.completedCount}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Total Registered Volume</span>
              <span className="font-bold text-slate-900">{analytics.donations.totalDonatedKg} kg</span>
            </div>
          </div>
        </Card>

        {/* Derived Waste & Spoilage Prevention Metrics */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Waste & Expiry Audit</h3>
            </div>
            <span className="text-xs font-semibold text-slate-500">Derived</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Expired Unclaimed Batches</span>
              <span className="font-bold text-rose-600">{analytics.wasteAndExpiry.expiredDonationsCount}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Rejected / Cancelled</span>
              <span className="font-bold text-slate-700">{analytics.wasteAndExpiry.rejectedOrCancelledCount}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Disputed Quantity</span>
              <span className="font-bold text-slate-700">{analytics.wasteAndExpiry.disputedKg} kg</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Diversion Efficiency</span>
              <span className="font-bold text-emerald-600">{analytics.donations.diversionEfficiencyPercent}%</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Stakeholder Scorecards (Providers & NGOs) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <CardTitle>Top Contributing Food Donors</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/70 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3">Organization</th>
                    <th className="px-6 py-3">City</th>
                    <th className="px-6 py-3">Batches</th>
                    <th className="px-6 py-3">Rescued (kg)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analytics.stakeholders.topProviders.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-6 text-center text-slate-400">
                        No food provider donation records in this timeframe.
                      </td>
                    </tr>
                  ) : (
                    analytics.stakeholders.topProviders.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-3 font-semibold text-slate-900">{p.organizationName}</td>
                        <td className="px-6 py-3 text-slate-600">{p.city}</td>
                        <td className="px-6 py-3 font-medium text-slate-900">{p.donationsCount}</td>
                        <td className="px-6 py-3 font-bold text-emerald-600">{p.totalKgRescued} kg</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-blue-600" />
              <CardTitle>Top Recipient NGOs</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/70 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3">NGO Hub</th>
                    <th className="px-6 py-3">City</th>
                    <th className="px-6 py-3">Deliveries</th>
                    <th className="px-6 py-3">Meals Provided</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analytics.stakeholders.topNgos.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-6 text-center text-slate-400">
                        No completed NGO delivery records in this timeframe.
                      </td>
                    </tr>
                  ) : (
                    analytics.stakeholders.topNgos.map((n) => (
                      <tr key={n.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-3 font-semibold text-slate-900">{n.organizationName}</td>
                        <td className="px-6 py-3 text-slate-600">{n.city}</td>
                        <td className="px-6 py-3 font-medium text-slate-900">{n.deliveriesReceived}</td>
                        <td className="px-6 py-3 font-bold text-blue-600">{n.mealsDistributed} meals</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queue & Security Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Recent Food Donations</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Submissions awaiting or undergoing verification</p>
              </div>
              <Link href="/admin/donations" className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200/70 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-6 py-3">ID</th>
                      <th className="px-6 py-3">Food Item</th>
                      <th className="px-6 py-3">Provider</th>
                      <th className="px-6 py-3">Quantity</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentDonations.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3.5 font-mono font-bold text-slate-900">{d.humanReadableId}</td>
                        <td className="px-6 py-3.5 font-semibold text-slate-900">{d.foodName}</td>
                        <td className="px-6 py-3.5 text-slate-700">{d.provider.organizationName}</td>
                        <td className="px-6 py-3.5 font-medium text-slate-900">{d.quantity} {d.unit}</td>
                        <td className="px-6 py-3.5"><StatusBadge status={d.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Security & Audit Stream</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-slate-100 p-0 text-xs">
              {recentLogs.map((log) => (
                <div key={log.id} className="p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-[11px]">{log.action.replace(/_/g, " ")}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Role: <b>{log.actorRole}</b> &bull; Entity: {log.entity}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}