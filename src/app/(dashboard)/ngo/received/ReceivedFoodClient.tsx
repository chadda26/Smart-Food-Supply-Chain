"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/common/StatusBadge";
import { CheckCircle2, AlertCircle, ShieldCheck, Star, FileText, Download } from "lucide-react";

export function ReceivedFoodClient({ deliveries }: { deliveries: any[] }) {
  const router = useRouter();
  const [selectedDelivery, setSelectedDelivery] = useState<any | null>(null);
  const [feedbackDelivery, setFeedbackDelivery] = useState<any | null>(null);

  const [receivedQuantity, setReceivedQuantity] = useState<number>(0);
  const [conditionStatus, setConditionStatus] = useState("EXCELLENT");
  const [status, setStatus] = useState("CONFIRMED");
  const [disputeReason, setDisputeReason] = useState("");
  const [notes, setNotes] = useState("");

  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleConfirmVerification(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDelivery) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/deliveries/${selectedDelivery.id}/confirm-receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receivedQuantity: Number(receivedQuantity),
          conditionStatus,
          status,
          disputeReason: status === "DISPUTED" ? disputeReason : null,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to confirm receipt");

      setSuccess("Handoff verified and recorded on immutable traceability timeline!");
      setTimeout(() => {
        setSelectedDelivery(null);
        setSuccess(null);
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleFeedbackSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!feedbackDelivery) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryId: feedbackDelivery.id,
          rating: Number(rating),
          comment,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to submit rating");

      setSuccess("Thank you! Distributor reliability rating updated.");
      setTimeout(() => {
        setFeedbackDelivery(null);
        setSuccess(null);
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Received Surplus Food & Handoff Confirmations</h2>
        <p className="text-xs text-slate-500">Confirm physical handoff receipt, inspect condition, and provide feedback</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/70 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3">Donation ID</th>
                  <th className="px-6 py-3">Food Item</th>
                  <th className="px-6 py-3">Donor</th>
                  <th className="px-6 py-3">Driver</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deliveries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No deliveries recorded yet.
                    </td>
                  </tr>
                ) : (
                  deliveries.map((del) => (
                    <tr key={del.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">{del.donation.humanReadableId}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900">{del.donation.foodName}</td>
                      <td className="px-6 py-4 text-slate-700">{del.donation.provider.organizationName}</td>
                      <td className="px-6 py-4 text-slate-700">
                        <div className="flex items-center gap-2">
                          {del.distributor.user.avatarUrl ? (
                            <img
                              src={del.distributor.user.avatarUrl}
                              alt={del.distributor.user.name}
                              className="w-6 h-6 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[9px] border border-emerald-200 shrink-0">
                              {del.distributor.user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="font-medium text-slate-800">{del.distributor.user.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4"><StatusBadge status={del.status} /></td>
                      <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                        {!del.deliveryVerification ? (
                          <Button
                            onClick={() => {
                              setSelectedDelivery(del);
                              setReceivedQuantity(del.donation.quantity);
                            }}
                            variant="success"
                            size="sm"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Confirm Receipt
                          </Button>
                        ) : !del.feedback ? (
                          <Button
                            onClick={() => setFeedbackDelivery(del)}
                            variant="outline"
                            size="sm"
                          >
                            <Star className="w-3.5 h-3.5 mr-1 text-amber-500" /> Rate Driver
                          </Button>
                        ) : (
                          <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Verified & Rated ({del.feedback.rating}★)
                          </span>
                        )}

                        <a
                          href={`/api/reports/transit/${del.id}`}
                          download
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Button variant="outline" size="sm" className="text-slate-700 hover:text-emerald-700">
                            <Download className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Report (PDF)
                          </Button>
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {selectedDelivery && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedDelivery(null)}
          title={`Confirm Physical Receipt - ${selectedDelivery.donation.humanReadableId}`}
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

          <form onSubmit={handleConfirmVerification} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
              <div>
                <span className="font-bold text-slate-900 block">{selectedDelivery.donation.foodName}</span>
                <span className="text-slate-500 block mt-0.5">Delivered by driver {selectedDelivery.distributor.user.name}</span>
              </div>
              {selectedDelivery.distributor.user.avatarUrl ? (
                <img
                  src={selectedDelivery.distributor.user.avatarUrl}
                  alt={selectedDelivery.distributor.user.name}
                  className="w-9 h-9 rounded-full object-cover border border-emerald-500 shadow-sm shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs border border-emerald-200 shrink-0">
                  {selectedDelivery.distributor.user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <Input
              label={`Quantity Verified (in ${selectedDelivery.donation.unit})`}
              type="number"
              required
              min={0.1}
              step={0.1}
              value={receivedQuantity}
              onChange={(e) => setReceivedQuantity(Number(e.target.value))}
            />

            <Select
              label="Package & Temperature Condition on Receipt"
              value={conditionStatus}
              onChange={(e) => setConditionStatus(e.target.value)}
              options={[
                { value: "EXCELLENT", label: "Excellent - Fresh & Temperature Compliant" },
                { value: "GOOD", label: "Good - Intact Packaging" },
                { value: "ACCEPTABLE", label: "Acceptable - Edible / Minor Container Wear" },
                { value: "DAMAGED", label: "Damaged / Partial Spoilage" },
                { value: "REJECTED", label: "Rejected - Unsafe for Consumption" },
              ]}
            />

            <Select
              label="Handoff Disposition"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: "CONFIRMED", label: "Accept & Confirm Handover" },
                { value: "DISPUTED", label: "Log Exception / Dispute Delivery" },
              ]}
            />

            {status === "DISPUTED" && (
              <Input
                label="Dispute Reason"
                required
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="e.g., Temperature above 10°C, packaging breached"
              />
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Verification Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Inspected by receiving supervisor..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedDelivery(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="success" size="sm" isLoading={loading}>
                Record Verified Receipt
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {feedbackDelivery && (
        <Modal
          isOpen={true}
          onClose={() => setFeedbackDelivery(null)}
          title={`Rate Delivery Partner - ${feedbackDelivery.distributor.user.name}`}
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

          <form onSubmit={handleFeedbackSubmit} className="space-y-4 text-xs">
            <Select
              label="Overall Rating (1 to 5 Stars)"
              value={String(rating)}
              onChange={(e) => setRating(Number(e.target.value))}
              options={[
                { value: "5", label: "★★★★★ (5/5) - Outstanding & Punctual" },
                { value: "4", label: "★★★★☆ (4/5) - Good Service" },
                { value: "3", label: "★★★☆☆ (3/5) - Average" },
                { value: "2", label: "★★☆☆☆ (2/5) - Substandard" },
                { value: "1", label: "★☆☆☆☆ (1/5) - Poor / Delayed" },
              ]}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Feedback & Comments (Optional)
              </label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Driver was prompt and food was securely loaded in insulated containers."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setFeedbackDelivery(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={loading}>
                Submit Feedback
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}