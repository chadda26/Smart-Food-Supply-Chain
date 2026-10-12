"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PlusCircle, AlertTriangle, Image as ImageIcon, CheckCircle2, Upload } from "lucide-react";

export function NgoWasteClient({ initialRecords }: { initialRecords: any[] }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    foodName: "",
    foodCategory: "COOKED_MEALS",
    quantityWasted: "",
    unit: "KG",
    reason: "SPOILED_IN_STORAGE",
    disposalMethod: "COMPOSTING",
    stage: "NGO_WAREHOUSE",
    notes: "",
    photoUrl: "",
  });

  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    setError(null);

    try {
      const data = new FormData();
      data.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to upload photo.");

      setForm((prev) => ({ ...prev, photoUrl: json.data.url }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const payload = {
        foodName: form.foodName,
        foodCategory: form.foodCategory,
        quantityWasted: parseFloat(form.quantityWasted),
        unit: form.unit,
        reason: form.reason,
        disposalMethod: form.disposalMethod,
        stage: form.stage,
        notes: form.notes || undefined,
        photoUrl: form.photoUrl || undefined,
      };

      const res = await fetch("/api/waste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to log waste record.");

      setSuccessMsg(`Logged waste incident successfully as ${json.data.humanReadableId}`);
      setForm({
        foodName: "",
        foodCategory: "COOKED_MEALS",
        quantityWasted: "",
        unit: "KG",
        reason: "SPOILED_IN_STORAGE",
        disposalMethod: "COMPOSTING",
        stage: "NGO_WAREHOUSE",
        notes: "",
        photoUrl: "",
      });
      setTimeout(() => {
        setIsOpen(false);
        setSuccessMsg(null);
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Warehouse Spoilage & Damaged Food Log</h3>
          <p className="text-xs text-slate-500">Document storage losses, cold-chain breakdowns, or damaged items with circular disposal</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsOpen(true)}>
          <PlusCircle className="w-4 h-4 mr-1.5" /> Log Warehouse Loss / Spoilage
        </Button>
      </div>

      {/* Modal Form */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Log Warehouse Spoilage / Food Loss</h4>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Food Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cooked Rice Surplus, Fresh Bakery Trays"
                  value={form.foodName}
                  onChange={(e) => setForm({ ...form, foodName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category *</label>
                  <select
                    value={form.foodCategory}
                    onChange={(e) => setForm({ ...form, foodCategory: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="COOKED_MEALS">Cooked Meals</option>
                    <option value="PRODUCE">Fresh Produce</option>
                    <option value="BAKERY">Bakery</option>
                    <option value="DAIRY">Dairy</option>
                    <option value="PACKAGED_GOODS">Packaged Goods</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Quantity (KG) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    placeholder="e.g. 8.0"
                    value={form.quantityWasted}
                    onChange={(e) => setForm({ ...form, quantityWasted: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Waste Reason *</label>
                  <select
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="SPOILED_IN_STORAGE">Spoiled in NGO Storage</option>
                    <option value="COLD_CHAIN_FAILURE">Cold Storage / Freezer Breakdown</option>
                    <option value="DAMAGED_IN_TRANSIT">Transit Handling Damage</option>
                    <option value="REJECTED_AT_DELIVERY">Rejected on Arrival</option>
                    <option value="CONTAMINATED">Contaminated / Unsafe</option>
                    <option value="OTHER">Other Loss</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Disposal Method *</label>
                  <select
                    value={form.disposalMethod}
                    onChange={(e) => setForm({ ...form, disposalMethod: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="COMPOSTING">Composting (Organic Recycling)</option>
                    <option value="ANIMAL_FEED">Animal Feed</option>
                    <option value="BIO_ENERGY_ANAEROBIC">Bio-Energy / Anaerobic</option>
                    <option value="COMMERCIAL_INCINERATION">Waste-to-Energy Incineration</option>
                    <option value="LANDFILL_DISPOSAL">Municipal Landfill</option>
                    <option value="NOT_SPECIFIED">Not Specified</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Supporting Photo Proof (Optional)</label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium">
                    <Upload className="w-3.5 h-3.5" />
                    {uploadingPhoto ? "Uploading..." : "Upload Photo"}
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                  {form.photoUrl && (
                    <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Photo Attached
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Disposal Notes & Action</label>
                <textarea
                  rows={2}
                  placeholder="Details regarding disposal and safety precautions..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={loading || uploadingPhoto}>
                  {loading ? "Recording..." : "Save Waste Record"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/70 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3">Waste ID</th>
                  <th className="px-5 py-3">Food Item</th>
                  <th className="px-5 py-3">Quantity</th>
                  <th className="px-5 py-3">Reason</th>
                  <th className="px-5 py-3">Disposal Destination</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3 text-right">Photo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {initialRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                      No warehouse spoilage or damaged items logged.
                    </td>
                  </tr>
                ) : (
                  initialRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-900">{r.humanReadableId}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-900">{r.foodName}</td>
                      <td className="px-5 py-3.5 font-bold text-rose-600">{r.quantityWasted} {r.unit}</td>
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
                      <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px]">
                        {new Date(r.recordedAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {r.photoUrl ? (
                          <a
                            href={r.photoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline"
                          >
                            <ImageIcon className="w-3.5 h-3.5" /> View
                          </a>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
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
  );
}