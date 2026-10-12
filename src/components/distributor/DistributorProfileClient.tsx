"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Truck, Camera, Upload, Trash2, CheckCircle2, AlertCircle, ShieldCheck, User } from "lucide-react";

interface DistributorProfileClientProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    phone?: string | null;
    avatarUrl?: string | null;
  };
  distributor: {
    id: string;
    vehicleType: string;
    reliabilityScore: number;
    availabilityStatus: string;
    licenseNumber?: string | null;
    totalDeliveries?: number;
  } | null;
}

export function DistributorProfileClient({ user, distributor }: DistributorProfileClientProps) {
  const router = useRouter();
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(user.avatarUrl || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
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

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. Upload file using /api/upload
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Failed to upload photo.");

      const newAvatarUrl = uploadData.data.url;

      // 2. Save avatarUrl to User model via PATCH /api/auth/me
      const updateRes = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: newAvatarUrl }),
      });

      const updateData = await updateRes.json();
      if (!updateRes.ok) throw new Error(updateData.error?.message || "Failed to update profile photo.");

      setCurrentAvatarUrl(newAvatarUrl);
      setSuccess("Driver profile photo updated successfully!");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred during upload.");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemovePhoto() {
    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const updateRes = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: null }),
      });

      const updateData = await updateRes.json();
      if (!updateRes.ok) throw new Error(updateData.error?.message || "Failed to remove profile photo.");

      setCurrentAvatarUrl(null);
      setSuccess("Profile photo removed.");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to remove photo.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Distributor Logistics Profile</h2>
        <p className="text-xs text-slate-500">Your verified driver identity, vehicle details, and availability status</p>
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

      {/* Driver Identity Card with Avatar Upload */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-600" />
            <CardTitle>Driver Identity & Photograph</CardTitle>
          </div>
          <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
            {distributor?.availabilityStatus || "AVAILABLE"}
          </span>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-200/70">
            <div className="relative">
              {currentAvatarUrl ? (
                <img
                  src={currentAvatarUrl}
                  alt={user.name}
                  className="w-24 h-24 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-3xl border-2 border-slate-200">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 p-1.5 bg-emerald-600 text-white rounded-full shadow">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="flex-1 space-y-2 text-center sm:text-left">
              <div>
                <h3 className="text-base font-bold text-slate-900">{user.name}</h3>
                <p className="text-xs text-slate-500">Official Assigned Courier & Driver</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  This photograph is displayed to recipient NGOs during delivery coordination and handoff.
                </p>
              </div>

              <div className="flex items-center gap-3 justify-center sm:justify-start pt-2">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors">
                  <Camera className="w-3.5 h-3.5" />
                  {uploading ? "Uploading..." : currentAvatarUrl ? "Change Photo" : "Upload Driver Photo"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={uploading}
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>

                {currentAvatarUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    onClick={handleRemovePhoto}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Operational Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block mb-1">Assigned Vehicle</span>
              <span className="font-semibold text-slate-900 capitalize">
                {distributor?.vehicleType.toLowerCase() || "Van"}
              </span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block mb-1">Reliability Rating</span>
              <span className="font-semibold text-slate-900">
                {distributor?.reliabilityScore ? distributor.reliabilityScore.toFixed(1) : "5.0"} ★ (
                {distributor?.totalDeliveries || 0} completed deliveries)
              </span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block mb-1">Email</span>
              <span className="font-semibold text-slate-900">{user.email}</span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block mb-1">Phone Contact</span>
              <span className="font-semibold text-slate-900">{user.phone || "Not set"}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}