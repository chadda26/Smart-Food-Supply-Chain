"use client";
import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { UserRole } from "@/types";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = (searchParams.get("role") as UserRole) || "FOOD_PROVIDER";

  const [role, setRole] = useState<UserRole>(initialRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // Role specific fields
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState("RESTAURANT");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Metropolis");
  const [foodCapacity, setFoodCapacity] = useState<number>(300);
  const [vehicleType, setVehicleType] = useState("VAN");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const r = searchParams.get("role") as UserRole;
    if (r) setRole(r);
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload: any = {
        name,
        email,
        phone,
        password,
        role,
        organizationName: orgName || name,
        address: address || "City Center",
        city: city || "Metropolis",
      };

      if (role === "FOOD_PROVIDER") {
        payload.organizationType = orgType;
      } else if (role === "NGO") {
        payload.foodCapacity = Number(foodCapacity) || 250;
      } else if (role === "DISTRIBUTOR") {
        payload.vehicleType = vehicleType;
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Registration failed");
      }

      setSuccess("Account successfully registered! Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "An unexpected registration error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
            🌱
          </div>
          <span className="text-lg font-bold text-slate-900">Smart Food Chain</span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Create an Account
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Register your organization or logistics profile to participate in surplus food rescue
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4">
        <Card>
          <CardContent className="pt-6">
            {error && (
              <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role Selector Tabs */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Select User Role
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: "FOOD_PROVIDER", label: "Provider" },
                    { key: "NGO", label: "NGO / Bank" },
                    { key: "DISTRIBUTOR", label: "Distributor" },
                    { key: "ADMIN", label: "Admin" },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setRole(tab.key as UserRole)}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                        role === tab.key
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Contact Person Name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                />

                <Input
                  label="Email Address"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@org.com"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Phone Number"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555-0199"
                />

                <Input
                  label="Password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              {/* Dynamic Organization Fields */}
              {role === "FOOD_PROVIDER" && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold text-slate-900">Food Provider Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Organization / Restaurant Name"
                      required
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="Green Leaf Bistro"
                    />
                    <Select
                      label="Facility Type"
                      value={orgType}
                      onChange={(e) => setOrgType(e.target.value)}
                      options={[
                        { value: "RESTAURANT", label: "Restaurant / Cafe" },
                        { value: "HOTEL", label: "Hotel / Catering" },
                        { value: "SUPERMARKET", label: "Supermarket / Grocer" },
                        { value: "WHOLESALER", label: "Wholesale Supplier" },
                        { value: "EVENT_ORGANIZER", label: "Event / Banquet" },
                        { value: "OTHER", label: "Other Food Business" },
                      ]}
                    />
                  </div>
                  <Input
                    label="Physical Address"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="124 Downtown Avenue, District 4"
                  />
                </div>
              )}

              {role === "NGO" && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold text-slate-900">NGO / Food Bank Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="NGO Name"
                      required
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="Hope Food Network"
                    />
                    <Input
                      label="Food Storage Capacity (kg)"
                      type="number"
                      required
                      value={foodCapacity}
                      onChange={(e) => setFoodCapacity(Number(e.target.value))}
                      placeholder="350"
                    />
                  </div>
                  <Input
                    label="Distribution Center Address"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="78 Community Road"
                  />
                </div>
              )}

              {role === "DISTRIBUTOR" && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold text-slate-900">Logistics Profile</h4>
                  <Select
                    label="Primary Transportation Vehicle"
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    options={[
                      { value: "BIKE", label: "Motorbike / Cargo Bike" },
                      { value: "CAR", label: "Standard Car" },
                      { value: "VAN", label: "Delivery Van (Standard)" },
                      { value: "REFRIGERATED_TRUCK", label: "Temperature-Controlled Truck" },
                    ]}
                  />
                </div>
              )}

              <Button type="submit" className="w-full mt-2" isLoading={loading} size="md">
                Complete Registration <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-500">
              Already registered?{" "}
              <Link href="/login" className="font-semibold text-emerald-600 hover:underline">
                Sign in here
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <LoadingSpinner label="Loading registration portal..." />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}