"use client";
import React from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-200 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Application Notice</h2>
        <p className="mt-2 text-sm text-slate-600">
          {error.message || "An unexpected error occurred while loading this view."}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button onClick={() => reset()} variant="primary" size="sm">
            <RefreshCw className="w-4 h-4 mr-1.5" /> Try Again
          </Button>
          <Link href="/">
            <Button variant="outline" size="sm">
              <Home className="w-4 h-4 mr-1.5" /> Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}