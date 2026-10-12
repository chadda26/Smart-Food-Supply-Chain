const fs = require('fs');
const path = require('path');
function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
  console.log('Created:', file);
}

// NGO Food Page
write('src/app/(dashboard)/ngo/food/page.tsx', `import React from "react";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AvailableFoodClient } from "./AvailableFoodClient";

export default async function NgoFoodPage() {
  const user = await requireRole("NGO");
  const ngo = await db.ngo.findUnique({ where: { userId: user.id } });

  const donations = await db.foodDonation.findMany({
    where: {
      status: { in: ["APPROVED", "REQUESTED"] },
      expiryTime: { gt: new Date() },
    },
    include: {
      provider: true,
      requests: { where: { ngoId: ngo?.id } },
    },
    orderBy: { expiryTime: "asc" },
  });

  return (
    <DashboardLayout user={user}>
      <AvailableFoodClient donations={donations} ngo={ngo} />
    </DashboardLayout>
  );
}
`);

// NGO Food Client
write('src/app/(dashboard)/ngo/food/AvailableFoodClient.tsx', `"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { formatDate, formatTimeRemaining } from "@/lib/utils";
import { Package, Clock, MapPin, AlertCircle, CheckCircle2, Search } from "lucide-react";

export function AvailableFoodClient({ donations, ngo }: { donations: any[]; ngo: any }) {
  const router = useRouter();
  const [selectedDonation, setSelectedDonation] = useState<any | null>(null);
  const [requestedQuantity, setRequestedQuantity] = useState<number>(10);
  const [requestReason, setRequestReason] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const filtered = donations.filter((d) => {
    const matchesSearch =
      d.foodName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.provider.organizationName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "ALL" || d.foodCategory === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  async function handleRequestSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDonation) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donationId: selectedDonation.id,
          requestedQuantity: Number(requestedQuantity),
          requestReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to submit food request.");

      setSuccess("Request successfully registered! Admin matching will review and assign dispatch.");
      setTimeout(() => {
        setSelectedDonation(null);
        setSuccess(null);
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "An error occurred submitting the request");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Available Surplus Food Batches</h2>
          <p className="text-xs text-slate-500">Verified edible food batches available for local community distribution</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by food item or provider name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="ALL">All Food Categories</option>
          <option value="COOKED_MEALS">Cooked Meals</option>
          <option value="RAW_INGREDIENTS">Raw Ingredients</option>
          <option value="PACKAGED_FOOD">Packaged Food</option>
          <option value="BAKERY">Bakery</option>
          <option value="PRODUCE">Produce</option>
          <option value="DAIRY">Dairy</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
            No matching available surplus food batches found.
          </div>
        ) : (
          filtered.map((d) => {
            const remaining = formatTimeRemaining(d.expiryTime);
            const hasRequested = d.requests && d.requests.length > 0;

            return (
              <Card key={d.id} className="p-5 flex flex-col justify-between hover:border-emerald-300 transition-all shadow-xs">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {d.humanReadableId}
                    </span>
                    <span className={\`text-[10px] font-bold px-2 py-0.5 rounded-md \${remaining.isUrgent ? "bg-rose-50 text-rose-700 font-bold" : "bg-slate-100 text-slate-700"}\`}>
                      {remaining.text}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{d.foodName}</h3>
                  <p className="text-xs text-slate-500 font-medium capitalize mt-0.5">
                    {d.foodCategory.toLowerCase().replace(/_/g, " ")} &bull; {d.quantity} {d.unit}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-700">Provider:</span>
                      <span className="truncate">{d.provider.organizationName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{d.provider.address}, {d.provider.city}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Prepared: {formatDate(d.preparationTime)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100">
                  {hasRequested ? (
                    <Button variant="outline" size="sm" className="w-full text-emerald-700 bg-emerald-50/50" disabled>
                      <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" /> Request Submitted
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        setSelectedDonation(d);
                        setRequestedQuantity(d.quantity);
                      }}
                      variant="primary"
                      size="sm"
                      className="w-full"
                    >
                      Request Food Allocation
                    </Button>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {selectedDonation && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedDonation(null)}
          title={\`Request Surplus Food - \${selectedDonation.humanReadableId}\`}
        >
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleRequestSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="font-bold text-slate-900 text-sm">{selectedDonation.foodName}</p>
              <p className="text-slate-500 mt-0.5">
                From: <b>{selectedDonation.provider.organizationName}</b> &bull; Available: {selectedDonation.quantity} {selectedDonation.unit}
              </p>
            </div>

            <Input
              label={\`Quantity to Request (Max: \${selectedDonation.quantity} \${selectedDonation.unit})\`}
              type="number"
              required
              min={1}
              max={selectedDonation.quantity}
              value={requestedQuantity}
              onChange={(e) => setRequestedQuantity(Number(e.target.value))}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Distribution Purpose / Community Need
              </label>
              <textarea
                rows={3}
                required
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                placeholder="e.g. Evening meal distribution for 60 individuals at community shelter."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedDonation(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={loading}>
                Confirm Food Request
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
`);

// NGO Requests Page
write('src/app/(dashboard)/ngo/requests/page.tsx', `import React from "react";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDate } from "@/lib/utils";

export default async function NgoRequestsPage() {
  const user = await requireRole("NGO");
  const ngo = await db.ngo.findUnique({ where: { userId: user.id } });

  const requests = await db.donationRequest.findMany({
    where: { ngoId: ngo?.id },
    include: {
      donation: { include: { provider: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DashboardLayout user={user}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">My Surplus Food Requests</h2>
          <p className="text-xs text-slate-500">Track pending and approved allocation requests</p>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/70 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3">Donation ID</th>
                    <th className="px-6 py-3">Food Item</th>
                    <th className="px-6 py-3">Donor Provider</th>
                    <th className="px-6 py-3">Quantity Requested</th>
                    <th className="px-6 py-3">Reason</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Requested Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                        No food requests submitted yet.
                      </td>
                    </tr>
                  ) : (
                    requests.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-slate-900">{r.donation.humanReadableId}</td>
                        <td className="px-6 py-4 font-semibold text-slate-900">{r.donation.foodName}</td>
                        <td className="px-6 py-4 text-slate-700">{r.donation.provider.organizationName}</td>
                        <td className="px-6 py-4 font-medium text-slate-900">{r.requestedQuantity} {r.donation.unit}</td>
                        <td className="px-6 py-4 text-slate-600 italic max-w-xs truncate">&quot;{r.requestReason}&quot;</td>
                        <td className="px-6 py-4"><StatusBadge status={r.status} /></td>
                        <td className="px-6 py-4 text-slate-400">{formatDate(r.createdAt)}</td>
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