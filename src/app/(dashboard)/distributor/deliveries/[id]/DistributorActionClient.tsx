"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/common/StatusBadge";
import { TrackingMap } from "@/components/maps/TrackingMap";
import { LiveDriverBroadcaster } from "@/components/maps/LiveDriverBroadcaster";
import { formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Play,
  ShieldCheck,
  MapPin,
  Truck,
  Radio,
  Camera,
  Upload,
  Image as ImageIcon,
  X,
} from "lucide-react";

export function DistributorActionClient({ delivery, user }: { delivery: any; user: any }) {
  const router = useRouter();
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState("1234");
  const [packageCondition, setPackageCondition] = useState("GOOD");
  const [temperatureCheck, setTemperatureCheck] = useState("4°C (Safe chilled range)");
  const [notes, setNotes] = useState("");

  // Photo upload / camera capture state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
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

    setError(null);
    setPhotoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPhotoPreview(objectUrl);
  }

  function handleRemovePhoto() {
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    setPhotoUrl(null);
  }

  async function handleStartPickup() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/deliveries/${delivery.id}/pickup`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to update status to pickup en-route");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyPickupSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Mandatory Photo Validation
    if (!photoFile && !photoUrl) {
      setError("Driver verification photo is mandatory. Please capture or upload a photo of the food batch.");
      return;
    }

    setLoading(true);

    try {
      let finalPhotoUrl = photoUrl;

      // Upload photo if new file selected
      if (photoFile && !finalPhotoUrl) {
        setUploadingPhoto(true);
        const formData = new FormData();
        formData.append("file", photoFile);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.error?.message || "Failed to upload verification photo.");
        }

        finalPhotoUrl = uploadData.data.url;
        setPhotoUrl(finalPhotoUrl);
        setUploadingPhoto(false);
      }

      const res = await fetch(`/api/deliveries/${delivery.id}/verify-pickup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationCode,
          packageCondition,
          temperatureCheck,
          photoUrl: finalPhotoUrl,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Verification failed");

      setSuccess("Pickup verified with mandatory photo evidence on traceability ledger!");
      setTimeout(() => {
        setShowPickupModal(false);
        setSuccess(null);
        router.refresh();
      }, 1200);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setUploadingPhoto(false);
    }
  }

  async function handleStartDeliveryTransit() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/deliveries/${delivery.id}/start-delivery`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to start transit");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const existingPhoto = delivery.pickupVerification?.photoUrl;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Link href="/distributor/pickups">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{delivery.donation.foodName}</h2>
              <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {delivery.donation.humanReadableId}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Quantity: {delivery.donation.quantity} {delivery.donation.unit} &bull; Category: {delivery.donation.foodCategory.toLowerCase()}
            </p>
          </div>
        </div>
        <StatusBadge status={delivery.status} />
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Task Action Bar */}
      <Card className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="font-bold text-sm">Action Dispatch Stage</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Current lifecycle: <b className="text-emerald-400 uppercase">{delivery.status.replace(/_/g, " ")}</b>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {delivery.status === "ASSIGNED" && (
              <Button onClick={handleStartPickup} variant="primary" size="md" isLoading={loading}>
                <Play className="w-4 h-4 mr-1.5 fill-current" /> Start Route to Kitchen
              </Button>
            )}

            {delivery.status === "PICKUP_IN_PROGRESS" && (
              <Button onClick={() => setShowPickupModal(true)} variant="success" size="md">
                <ShieldCheck className="w-4 h-4 mr-1.5" /> Arrived & Verify Pickup
              </Button>
            )}

            {delivery.status === "PICKED_UP" && (
              <Button onClick={handleStartDeliveryTransit} variant="success" size="md" isLoading={loading}>
                <Truck className="w-4 h-4 mr-1.5" /> Start Transit & GPS Stream
              </Button>
            )}

            {delivery.status === "IN_TRANSIT" && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 bg-slate-800 px-3 py-2 rounded-lg border border-slate-700">
                <Radio className="w-4 h-4 animate-pulse" /> Live Telemetry Broadcasting En Route
              </span>
            )}

            {["DELIVERED", "COMPLETED"].includes(delivery.status) && (
              <span className="text-xs text-emerald-300 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Drop-off Completed & Verified
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Verified Pickup Proof Card if already verified */}
      {delivery.pickupVerification && (
        <Card className="p-5 border-emerald-200 bg-emerald-50/40">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Verified Pickup & Custody Proof</h3>
            </div>
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-full">
              Code: {delivery.pickupVerification.verificationCode} &bull; Condition: {delivery.pickupVerification.packageCondition}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
            <div className="space-y-1">
              <span className="text-slate-500 font-medium">Temperature Check:</span>
              <p className="font-bold text-slate-900">{delivery.pickupVerification.temperatureCheck || "Compliant"}</p>
              <span className="text-slate-500 font-medium block pt-1">Verified At:</span>
              <p className="text-slate-800">{formatDate(delivery.pickupVerification.verifiedAt)}</p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 font-medium">Driver Loading Notes:</span>
              <p className="text-slate-700 italic">{delivery.pickupVerification.notes || "Sealed and secured in cargo bay."}</p>
            </div>

            <div>
              <span className="text-slate-500 font-medium block mb-1.5">Mandatory Driver Photo Proof:</span>
              {existingPhoto ? (
                <div className="relative rounded-lg overflow-hidden border border-emerald-300 shadow-sm max-w-[180px]">
                  <img
                    src={existingPhoto}
                    alt="Driver verification photo"
                    className="w-full h-24 object-cover"
                  />
                  <a
                    href={existingPhoto}
                    target="_blank"
                    rel="noreferrer"
                    className="block bg-slate-900/80 text-white text-[10px] text-center py-1 hover:bg-slate-900 transition-colors"
                  >
                    View Full Image
                  </a>
                </div>
              ) : (
                <span className="text-slate-400 italic">No photo attached</span>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Live GPS Broadcaster Component when in transit */}
      {["IN_TRANSIT", "PICKED_UP", "PICKUP_IN_PROGRESS"].includes(delivery.status) && (
        <LiveDriverBroadcaster
          deliveryId={delivery.id}
          providerLat={delivery.donation.provider.latitude}
          providerLon={delivery.donation.provider.longitude}
          ngoLat={delivery.ngo.latitude}
          ngoLon={delivery.ngo.longitude}
        />
      )}

      {/* Live Interactive Map */}
      <TrackingMap
        providerLocation={{
          latitude: delivery.donation.provider.latitude,
          longitude: delivery.donation.provider.longitude,
          name: delivery.donation.provider.organizationName,
          address: delivery.donation.provider.address,
        }}
        ngoLocation={{
          latitude: delivery.ngo.latitude,
          longitude: delivery.ngo.longitude,
          name: delivery.ngo.organizationName,
          address: delivery.ngo.address,
        }}
        driverName={delivery.distributor.user.name}
        vehicleType={delivery.distributor.vehicleType}
        status={delivery.status}
      />

      {/* Pickup Verification Modal */}
      {showPickupModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowPickupModal(false)}
          title={`Verify Food Pickup - ${delivery.donation.humanReadableId}`}
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

          <form onSubmit={handleVerifyPickupSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-900 block">{delivery.donation.foodName}</span>
              <span className="text-slate-500 block mt-0.5">
                Provider: {delivery.donation.provider.organizationName} ({delivery.donation.provider.address})
              </span>
            </div>

            <Input
              label="4-Digit Verification Code"
              required
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="e.g. 4821"
            />

            <Select
              label="Package Physical Condition"
              value={packageCondition}
              onChange={(e) => setPackageCondition(e.target.value)}
              options={[
                { value: "GOOD", label: "Good - Sealed & Intact" },
                { value: "FAIR", label: "Fair - Minor Outer Box Creasing" },
                { value: "DAMAGED", label: "Damaged - Unsealed / Spillage" },
              ]}
            />

            <Input
              label="Holding Temperature Reading"
              value={temperatureCheck}
              onChange={(e) => setTemperatureCheck(e.target.value)}
              placeholder="e.g. 4°C chilled or 65°C hot holding"
            />

            {/* Mandatory Driver Photo Verification */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Mandatory Driver Verification Photo <span className="text-rose-500">*</span>
              </label>
              
              {!photoPreview ? (
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-emerald-500 transition-colors bg-slate-50/60">
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-2.5 rounded-full bg-emerald-50 text-emerald-600">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        Take photo or upload batch picture
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Required evidence of package seals and physical quality (Max 10MB)
                      </p>
                    </div>
                    <label className="mt-1 cursor-pointer">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-xs transition-colors">
                        <Upload className="w-3.5 h-3.5 mr-1.5" /> Choose / Capture Photo
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handlePhotoSelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-xl border border-emerald-300 overflow-hidden bg-white p-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={photoPreview}
                        alt="Photo preview"
                        className="w-14 h-14 object-cover rounded-lg border border-slate-200"
                      />
                      <div>
                        <p className="font-semibold text-slate-900 text-xs">{photoFile?.name || "Captured Photo"}</p>
                        <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Ready for verification upload
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Remove photo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Driver Loading Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Inspected and loaded into insulated carrier..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowPickupModal(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="success"
                size="sm"
                isLoading={loading || uploadingPhoto}
              >
                Record Verified Pickup
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}