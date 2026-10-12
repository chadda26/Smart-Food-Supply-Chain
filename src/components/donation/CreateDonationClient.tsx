"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ArrowLeft, Camera, Upload, Trash2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";

export function CreateDonationClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    foodName: "",
    foodCategory: "COOKED_MEALS",
    quantity: "",
    unit: "KG",
    preparationTime: new Date().toISOString().slice(0, 16),
    expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    dietaryFlags: "Vegetarian",
    storageRequirements: "Refrigerated (2-4°C)",
    notes: "",
    imageUrl: "",
  });

  const [uploadingImage, setUploadingImage] = useState(false);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPEG, PNG, WEBP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image size must be less than 10MB.");
      return;
    }

    setUploadingImage(true);
    setError(null);

    try {
      const data = new FormData();
      data.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to upload food photo.");

      setForm((prev) => ({ ...prev, imageUrl: json.data.url }));
    } catch (err: any) {
      setError(err.message || "Failed to upload food photo.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSubmit(isDraft = false) {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const payload = {
        foodName: form.foodName,
        foodCategory: form.foodCategory,
        quantity: parseFloat(form.quantity),
        unit: form.unit,
        preparationTime: new Date(form.preparationTime).toISOString(),
        expiryTime: new Date(form.expiryTime).toISOString(),
        dietaryFlags: form.dietaryFlags || undefined,
        storageRequirements: form.storageRequirements || undefined,
        notes: form.notes || undefined,
        imageUrl: form.imageUrl || undefined,
        isDraft,
      };

      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        const msg = json.error?.message || json.error || "Failed to create donation.";
        throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
      }

      setSuccess(
        isDraft
          ? `Donation draft saved (${json.data.humanReadableId})!`
          : `Donation submitted successfully as ${json.data.humanReadableId} for admin safety review!`
      );

      setTimeout(() => {
        router.push("/provider/donations");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "An error occurred submitting the donation.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/provider">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          </Link>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Register Surplus Food Batch</h2>
            <p className="text-xs text-slate-500">Document food quality, storage criteria, and upload food photo proof</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Batch Specifications & Food Photograph</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-xs">
          {/* Row 1: Food Name & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Food Item / Batch Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Freshly Baked Wheat Bread Trays, Steamed Rice"
                value={form.foodName}
                onChange={(e) => setForm({ ...form, foodName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Category *</label>
              <select
                value={form.foodCategory}
                onChange={(e) => setForm({ ...form, foodCategory: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
              >
                <option value="COOKED_MEALS">Cooked Meals</option>
                <option value="RAW_INGREDIENTS">Raw Ingredients</option>
                <option value="PACKAGED_FOOD">Packaged Food</option>
                <option value="BAKERY">Bakery</option>
                <option value="PRODUCE">Fresh Produce</option>
                <option value="DAIRY">Dairy</option>
                <option value="BEVERAGES">Beverages</option>
              </select>
            </div>
          </div>

          {/* Row 2: Quantity & Unit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Quantity *</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                placeholder="e.g. 25.0"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Unit *</label>
              <select
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
              >
                <option value="KG">Kilograms (KG)</option>
                <option value="PORTIONS">Portions / Meals</option>
                <option value="LITERS">Liters (L)</option>
                <option value="BOXES">Boxes / Crates</option>
              </select>
            </div>
          </div>

          {/* Row 3: Timestamps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Preparation Time *</label>
              <input
                type="datetime-local"
                required
                value={form.preparationTime}
                onChange={(e) => setForm({ ...form, preparationTime: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Estimated Safe Expiry Time *</label>
              <input
                type="datetime-local"
                required
                value={form.expiryTime}
                onChange={(e) => setForm({ ...form, expiryTime: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
              />
            </div>
          </div>

          {/* Food / Batch Photo Upload (Optional) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-bold text-slate-900 block text-xs">Food / Batch Photo (Optional)</label>
                <p className="text-[11px] text-slate-500">
                  Upload a photo of the actual food batch to assist recipient NGOs in quality assessment
                </p>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">JPEG / PNG / WEBP &bull; Max 10MB</span>
            </div>

            {form.imageUrl ? (
              <div className="flex items-center gap-4 p-3 bg-white rounded-xl border border-slate-200">
                <img
                  src={form.imageUrl}
                  alt="Food Batch Preview"
                  className="w-20 h-20 rounded-lg object-cover border border-slate-200 shadow-xs"
                />
                <div className="flex-1">
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Food Photograph Attached
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5 break-all">{form.imageUrl}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <label className="cursor-pointer text-[11px] font-semibold text-emerald-600 hover:underline">
                      Replace Photo
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                    <span className="text-slate-300">&bull;</span>
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, imageUrl: "" }))}
                      className="text-[11px] font-semibold text-rose-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-xs transition-colors">
                  <Camera className="w-4 h-4 text-emerald-600" />
                  {uploadingImage ? "Uploading Photo..." : "Upload Food Photo"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={uploadingImage}
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                <span className="text-[11px] text-slate-400">No image attached (donations can be created without a photo)</span>
              </div>
            )}
          </div>

          {/* Row 4: Quality, Storage & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Dietary Flags</label>
              <input
                type="text"
                placeholder="e.g. Vegetarian, Halal, Gluten-Free, Nut-Free"
                value={form.dietaryFlags}
                onChange={(e) => setForm({ ...form, dietaryFlags: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Storage Requirements</label>
              <input
                type="text"
                placeholder="e.g. Refrigerated (2-4°C), Keep Dry, Heated Warmer"
                value={form.storageRequirements}
                onChange={(e) => setForm({ ...form, storageRequirements: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Packaging & Handling Notes</label>
            <textarea
              rows={2}
              placeholder="Provide any additional packaging, allergen warnings, or special loading instructions..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="md"
              disabled={loading || uploadingImage}
              onClick={() => handleSubmit(true)}
            >
              Save as Draft
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={loading || uploadingImage}
              onClick={() => handleSubmit(false)}
            >
              {loading ? "Submitting..." : "Submit for Safety Review"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}