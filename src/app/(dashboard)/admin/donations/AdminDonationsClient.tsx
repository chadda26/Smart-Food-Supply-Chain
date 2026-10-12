"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDate } from "@/lib/utils";
import { CheckCircle2, XCircle, AlertCircle, Package } from "lucide-react";

export function AdminDonationsClient({ donations }: { donations: any[] }) {
  const router = useRouter();
  const [selectedDonation, setSelectedDonation] = useState<any | null>(null);
  const [actionType, setActionType] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReview(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDonation) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/donations/${selectedDonation.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionType,
          rejectionReason: actionType === "REJECT" ? rejectionReason : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Action failed");

      setSelectedDonation(null);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Food Donation Review & Verification Queue</h2>
        <p className="text-xs text-slate-500">Inspect submitted batches, verify food safety compliance, and approve for matching</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/70 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3">Batch ID</th>
                  <th className="px-6 py-3">Food Item</th>
                  <th className="px-6 py-3">Provider</th>
                  <th className="px-6 py-3">Quantity</th>
                  <th className="px-6 py-3">Expiry</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {donations.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{d.humanReadableId}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        {d.imageUrl ? (
                          <img
                            src={d.imageUrl}
                            alt={d.foodName}
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shrink-0">
                            <Package className="w-4 h-4" />
                          </div>
                        )}
                        <span className="font-semibold text-slate-900">{d.foodName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">{d.provider.organizationName}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{d.quantity} {d.unit}</td>
                    <td className="px-6 py-4 text-slate-500">{formatDate(d.expiryTime)}</td>
                    <td className="px-6 py-4"><StatusBadge status={d.status} /></td>
                    <td className="px-6 py-4 text-right">
                      {d.status === "SUBMITTED" ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            onClick={() => {
                              setSelectedDonation(d);
                              setActionType("APPROVE");
                            }}
                            variant="success"
                            size="sm"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedDonation(d);
                              setActionType("REJECT");
                            }}
                            variant="danger"
                            size="sm"
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Review Modal */}
      {selectedDonation && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedDonation(null)}
          title={`${actionType === "APPROVE" ? "Approve" : "Reject"} Donation - ${selectedDonation.humanReadableId}`}
        >
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleReview} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-slate-900">{selectedDonation.foodName}</p>
                <p className="text-slate-500 mt-0.5">
                  Provider: {selectedDonation.provider.organizationName} &bull; {selectedDonation.quantity} {selectedDonation.unit}
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

            {actionType === "APPROVE" ? (
              <p className="text-slate-600">
                Approving this batch will verify food safety compliance and make it immediately visible to partner NGOs in the area.
              </p>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Rejection Reason (Required)
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g., Temperature outside safe limits, expired preparation date..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedDonation(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant={actionType === "APPROVE" ? "success" : "danger"}
                size="sm"
                isLoading={loading}
              >
                Confirm {actionType === "APPROVE" ? "Approval" : "Rejection"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}