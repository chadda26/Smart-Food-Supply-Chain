"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatTimeRemaining } from "@/lib/utils";
import { HeartHandshake, Truck, Award, CheckCircle2, AlertCircle } from "lucide-react";

export function AdminMatchingClient({
  donations,
  distributors,
  ngos,
}: {
  donations: any[];
  distributors: any[];
  ngos: any[];
}) {
  const router = useRouter();
  const [selectedDonation, setSelectedDonation] = useState<any | null>(null);
  const [matchResults, setMatchResults] = useState<any[]>([]);
  const [selectedNgoId, setSelectedNgoId] = useState<string>("");
  const [selectedDistributorId, setSelectedDistributorId] = useState<string>("");
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function openMatchingModal(donation: any) {
    setSelectedDonation(donation);
    setError(null);
    setSuccess(null);
    setLoadingMatches(true);

    try {
      const res = await fetch(`/api/matching/calculate?donationId=${donation.id}`);
      const data = await res.json();
      if (res.ok) {
        setMatchResults(data.data || []);
        if (data.data && data.data.length > 0) {
          setSelectedNgoId(data.data[0].ngoId);
        }
      }
      if (distributors.length > 0) {
        setSelectedDistributorId(distributors[0].id);
      }
    } catch (err: any) {
      setError("Failed to load match calculation");
    } finally {
      setLoadingMatches(false);
    }
  }

  async function handleAssignSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDonation || !selectedNgoId || !selectedDistributorId) return;
    setError(null);
    setAssigning(true);

    try {
      const res = await fetch("/api/matching/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donationId: selectedDonation.id,
          ngoId: selectedNgoId,
          distributorId: selectedDistributorId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to assign distributor");

      setSuccess("Distributor assigned and delivery initiated!");
      setTimeout(() => {
        setSelectedDonation(null);
        setSuccess(null);
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAssigning(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">NGO Matching & Logistics Dispatch Engine</h2>
        <p className="text-xs text-slate-500">
          Transparent rule-based matching considering Haversine proximity, storage capacity, and consumption urgency
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {donations.length === 0 ? (
          <Card className="p-12 text-center text-xs text-slate-400">
            No approved donations currently awaiting matching.
          </Card>
        ) : (
          donations.map((d) => {
            const remaining = formatTimeRemaining(d.expiryTime);
            return (
              <Card key={d.id} className="p-5 hover:border-emerald-300 transition-all">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {d.humanReadableId}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${remaining.isUrgent ? "bg-rose-50 text-rose-700 font-bold" : "bg-slate-100 text-slate-700"}`}>
                        {remaining.text}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{d.foodName}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      From: <b>{d.provider.organizationName}</b> ({d.provider.address}) &bull; Quantity: {d.quantity} {d.unit}
                    </p>
                  </div>

                  <Button onClick={() => openMatchingModal(d)} variant="primary" size="sm">
                    <HeartHandshake className="w-3.5 h-3.5 mr-1.5" /> Match & Assign Logistics
                  </Button>
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
          title={`Match & Dispatch - ${selectedDonation.humanReadableId}`}
          maxWidth="lg"
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

          {loadingMatches ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Calculating proximity, capacity, and urgency scores...
            </div>
          ) : (
            <form onSubmit={handleAssignSubmit} className="space-y-5 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Algorithmic NGO Suitability Ranking
                </label>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {matchResults.map((m, idx) => (
                    <div
                      key={m.ngoId}
                      onClick={() => setSelectedNgoId(m.ngoId)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedNgoId === m.ngoId
                          ? "bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20"
                          : "bg-slate-50 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          {idx === 0 && <Award className="w-3.5 h-3.5 text-emerald-600" />}
                          {m.ngoName}
                        </span>
                        <span className="font-bold text-emerald-800 text-xs bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                          Match Score: {m.totalScore} / 100
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 font-mono">{m.rationale}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Available Logistics Partner / Driver
                </label>
                <select
                  value={selectedDistributorId}
                  onChange={(e) => setSelectedDistributorId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                >
                  {distributors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.user.name} ({d.vehicleType}) - Status: {d.availabilityStatus} - Rating: {d.reliabilityScore}★
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setSelectedDonation(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="success" size="sm" isLoading={assigning}>
                  <Truck className="w-3.5 h-3.5 mr-1" /> Confirm Dispatch Assignment
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}