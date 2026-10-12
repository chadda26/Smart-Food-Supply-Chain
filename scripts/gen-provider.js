const fs = require('fs');
const path = require('path');

function write(file, content) {
  const dir = path.dirname(file);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
  console.log('Created:', file);
}

// 1. Provider Dashboard
write('src/app/(dashboard)/provider/page.tsx', `import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDate, formatTimeRemaining } from "@/lib/utils";
import { Package, PlusCircle, Truck, HeartHandshake, ArrowRight, ShieldCheck, Leaf } from "lucide-react";
import { getProviderImpactMetrics } from "@/services/impact.service";

export default async function ProviderDashboardPage() {
  const user = await requireRole("FOOD_PROVIDER");
  const provider = await db.foodProvider.findUnique({
    where: { userId: user.id },
  });

  const donations = await db.foodDonation.findMany({
    where: { providerId: provider?.id },
    include: {
      delivery: { include: { distributor: { include: { user: true } }, ngo: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  const activeDonationsCount = await db.foodDonation.count({
    where: {
      providerId: provider?.id,
      status: { in: ["SUBMITTED", "APPROVED", "REQUESTED", "MATCHED", "ASSIGNED", "PICKUP_IN_PROGRESS", "IN_TRANSIT"] },
    },
  });

  const pendingPickupCount = await db.foodDonation.count({
    where: {
      providerId: provider?.id,
      status: { in: ["ASSIGNED", "PICKUP_IN_PROGRESS"] },
    },
  });

  const impact = provider ? await getProviderImpactMetrics(provider.id) : null;

  return (
    <DashboardLayout user={user}>
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8 bg-gradient-to-r from-emerald-800 to-slate-900 rounded-2xl p-6 text-white shadow-md">
        <div>
          <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider block">
            Food Provider Operations
          </span>
          <h2 className="text-2xl font-bold tracking-tight mt-1">
            Welcome, {provider?.organizationName || user.name}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Register surplus food batches, coordinate with verified NGOs, and track driver dispatches with real-time GPS.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/provider/donations/create">
            <Button variant="success" size="md">
              <PlusCircle className="w-4 h-4 mr-2" /> New Food Donation
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Donations</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{activeDonationsCount}</p>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 block">In lifecycle / transit</span>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Food Donated</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Leaf className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{impact?.totalKgDonated || 0} kg</p>
          <span className="text-[11px] text-blue-600 font-medium mt-1 block">{impact?.mealsServed || 0} meals served</span>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pending Pickups</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{pendingPickupCount}</p>
          <span className="text-[11px] text-amber-600 font-medium mt-1 block">Awaiting driver arrival</span>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Completed Rescues</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{impact?.completedDonations || 0}</p>
          <span className="text-[11px] text-purple-600 font-medium mt-1 block">{impact?.co2SavedKg || 0} kg CO2e saved</span>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Recent Food Batches</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">Your submitted and active surplus food batches</p>
          </div>
          <Link href="/provider/donations" className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/70 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3">Donation ID</th>
                  <th className="px-6 py-3">Food Item</th>
                  <th className="px-6 py-3">Quantity</th>
                  <th className="px-6 py-3">Expiry Urgency</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {donations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      No food batches created yet. Click "New Food Donation" to begin.
                    </td>
                  </tr>
                ) : (
                  donations.map((d) => {
                    const remaining = formatTimeRemaining(d.expiryTime);
                    return (
                      <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-slate-900">
                          {d.humanReadableId}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-slate-900 block">{d.foodName}</span>
                          <span className="text-[11px] text-slate-500 capitalize">{d.foodCategory.toLowerCase().replace(/_/g, " ")}</span>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-800">
                          {d.quantity} {d.unit}
                        </td>
                        <td className="px-6 py-4">
                          <span className={\`px-2 py-0.5 rounded-md font-medium text-[11px] \${remaining.isUrgent ? "bg-rose-50 text-rose-700 font-bold" : "text-slate-600 bg-slate-100"}\`}>
                            {remaining.text}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={d.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link href={\`/provider/donations/\${d.id}\`}>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
`);

// 2. Provider Profile
write('src/app/(dashboard)/provider/profile/page.tsx', `import React from "react";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Building2, MapPin, Mail, Phone, ShieldCheck } from "lucide-react";

export default async function ProviderProfilePage() {
  const user = await requireRole("FOOD_PROVIDER");
  const provider = await db.foodProvider.findUnique({ where: { userId: user.id } });

  return (
    <DashboardLayout user={user}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Food Provider Organization Profile</h2>
          <p className="text-xs text-slate-500">Your verified donor facility details and pickup coordinates</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <CardTitle>{provider?.organizationName || user.name}</CardTitle>
            </div>
            <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
              {provider?.verificationStatus || "VERIFIED"}
            </span>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-1">Facility Type</span>
                <span className="font-semibold text-slate-900 capitalize">{provider?.organizationType.toLowerCase() || "Restaurant"}</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-1">City</span>
                <span className="font-semibold text-slate-900">{provider?.city || "Metropolis"}</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-1">Contact Email</span>
                <span className="font-semibold text-slate-900">{user.email}</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-1">Phone</span>
                <span className="font-semibold text-slate-900">{user.phone || "Not set"}</span>
              </div>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block mb-1">Pickup Address</span>
              <span className="font-semibold text-slate-900">{provider?.address}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
`);

// 3. Provider Notifications
write('src/app/(dashboard)/provider/notifications/page.tsx', `import React from "react";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";
import { Bell, CheckCircle2 } from "lucide-react";

export default async function ProviderNotificationsPage() {
  const user = await requireRole("FOOD_PROVIDER");
  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DashboardLayout user={user}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Notifications & Alerts</h2>
          <p className="text-xs text-slate-500">Real-time alerts regarding donation approvals, NGO requests, and driver arrivals</p>
        </div>

        <Card>
          <CardContent className="divide-y divide-slate-100 p-0">
            {notifications.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No notifications received yet.
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="p-5 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="flex-1 text-xs">
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
`);

// 4. Provider Matching
write('src/app/(dashboard)/provider/matching/page.tsx', `import React from "react";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { HeartHandshake, MapPin, Award } from "lucide-react";

export default async function ProviderMatchingPage() {
  const user = await requireRole("FOOD_PROVIDER");
  const provider = await db.foodProvider.findUnique({ where: { userId: user.id } });

  const ngos = await db.ngo.findMany({
    where: { verificationStatus: "VERIFIED" },
    orderBy: { foodCapacity: "desc" },
  });

  return (
    <DashboardLayout user={user}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Partner NGOs & Food Banks Network</h2>
          <p className="text-xs text-slate-500">Verified community organizations ready to receive surplus food in your area</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {ngos.map((ngo) => (
            <Card key={ngo.id} className="p-5 hover:border-emerald-300 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{ngo.organizationName}</h3>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {ngo.address}, {ngo.city}
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200">
                  {ngo.availabilityStatus}
                </span>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>Storage Capacity: <b>{ngo.foodCapacity} kg</b></span>
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" /> Verified Partner
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
`);

// 5. Provider Deliveries list
write('src/app/(dashboard)/provider/deliveries/page.tsx', `import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDate } from "@/lib/utils";
import { Truck, MapPin } from "lucide-react";

export default async function ProviderDeliveriesListPage() {
  const user = await requireRole("FOOD_PROVIDER");
  const provider = await db.foodProvider.findUnique({ where: { userId: user.id } });

  const deliveries = await db.delivery.findMany({
    where: { providerId: provider?.id },
    include: {
      donation: true,
      distributor: { include: { user: true } },
      ngo: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DashboardLayout user={user}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Food Dispatches & Deliveries</h2>
          <p className="text-xs text-slate-500">Track driver assignments, active collections, and completed handoffs</p>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/70 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3">Donation ID</th>
                    <th className="px-6 py-3">Food Item</th>
                    <th className="px-6 py-3">Assigned Driver</th>
                    <th className="px-6 py-3">Recipient NGO</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Live Tracking</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deliveries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        No active or past delivery assignments found.
                      </td>
                    </tr>
                  ) : (
                    deliveries.map((del) => (
                      <tr key={del.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-slate-900">{del.donation.humanReadableId}</td>
                        <td className="px-6 py-4 font-semibold text-slate-900">{del.donation.foodName}</td>
                        <td className="px-6 py-4 text-slate-700">{del.distributor.user.name} ({del.distributor.vehicleType})</td>
                        <td className="px-6 py-4 text-slate-700">{del.ngo.organizationName}</td>
                        <td className="px-6 py-4"><StatusBadge status={del.status} /></td>
                        <td className="px-6 py-4 text-right">
                          <Link href={\`/provider/deliveries/\${del.id}/track\`}>
                            <Button variant="primary" size="sm">
                              <MapPin className="w-3.5 h-3.5 mr-1" /> Track GPS
                            </Button>
                          </Link>
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
`);