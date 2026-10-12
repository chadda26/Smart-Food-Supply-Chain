"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { AlertCircle, Lock, Mail, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Invalid credentials");
      }

      const role = data.data.user.role;
      if (role === "FOOD_PROVIDER") router.push("/provider");
      else if (role === "NGO") router.push("/ngo");
      else if (role === "DISTRIBUTOR") router.push("/distributor");
      else if (role === "ADMIN") router.push("/admin");
      else router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected login error occurred");
    } finally {
      setLoading(false);
    }
  }

  // Quick demo filler helper
  function fillDemo(roleEmail: string) {
    setEmail(roleEmail);
    setPassword("Demo@1234");
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
          Sign in to your dashboard
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Enter your registered email and password to access your role portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Card>
          <CardContent className="pt-6">
            {error && (
              <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.org"
              />

              <Input
                label="Password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />

              <Button type="submit" className="w-full" isLoading={loading} size="md">
                Sign In <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </form>

            {/* Quick Demo Login Credentials Bar */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2 text-center">
                Quick Demo Switcher (Password: Demo@1234)
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => fillDemo("provider@abcrestaurant.com")}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-left transition-colors"
                >
                  <span className="font-semibold block text-slate-800 text-[11px]">Provider</span>
                  <span className="text-[10px] text-slate-500 truncate block">ABC Restaurant</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo("contact@helpinghands.org")}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-left transition-colors"
                >
                  <span className="font-semibold block text-slate-800 text-[11px]">NGO</span>
                  <span className="text-[10px] text-slate-500 truncate block">Helping Hands</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo("rahul.kumar@fooddist.com")}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-left transition-colors"
                >
                  <span className="font-semibold block text-slate-800 text-[11px]">Distributor</span>
                  <span className="text-[10px] text-slate-500 truncate block">Rahul Kumar</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo("admin@foodchain.org")}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-left transition-colors"
                >
                  <span className="font-semibold block text-slate-800 text-[11px]">Admin</span>
                  <span className="text-[10px] text-slate-500 truncate block">System Admin</span>
                </button>
              </div>
            </div>

            <div className="mt-6 text-center text-xs text-slate-500">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold text-emerald-600 hover:underline">
                Create an account
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}