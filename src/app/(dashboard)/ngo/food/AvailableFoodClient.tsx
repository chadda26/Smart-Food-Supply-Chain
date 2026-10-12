"use client";
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
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${remaining.isUrgent ? "bg-rose-50 text-rose-700 font-bold" : "bg-slate-100 text-slate-700"}`}>
                      {remaining.text}
                    </span>
                  </div>

                  <div className="flex items-start gap-3 mt-1">
                    {d.imageUrl ? (
                      <img
                        src={d.imageUrl}
                        alt={d.foodName}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shrink-0">
                        <Package className="w-6 h-6" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-slate-900 truncate">{d.foodName}</h3>
                      <p className="text-xs text-slate-500 font-medium capitalize mt-0.5">
                        {d.foodCategory.toLowerCase().replace(/_/g, " ")} &bull; {d.quantity} {d.unit}
                      </p>
                    </div>
                  </div>

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
          title={`Request Surplus Food - ${selectedDonation.humanReadableId}`}
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
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-slate-900 text-sm">{selectedDonation.foodName}</p>
                <p className="text-slate-500 mt-0.5">
                  From: <b>{selectedDonation.provider.organizationName}</b> &bull; Available: {selectedDonation.quantity} {selectedDonation.unit}
                </p>
              </div>
              {selectedDonation.imageUrl && (
                <img
                  src={selectedDonation.imageUrl}
                  alt={selectedDonation.foodName}
                  className="w-12 h-12 rounded-lg object-cover border border-slate-200 shadow-xs shrink-0"
                />
              )}
            </div>

            <Input
              label={`Quantity to Request (Max: ${selectedDonation.quantity} ${selectedDonation.unit})`}
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
