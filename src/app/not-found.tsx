import Link from "next/link";
import { Home, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-200 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <Search className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">404 - Page Not Found</h2>
        <p className="mt-2 text-sm text-slate-600">
          The supply chain record or route you requested does not exist or has been relocated.
        </p>
        <div className="mt-6">
          <Link href="/">
            <Button variant="primary" size="md">
              <Home className="w-4 h-4 mr-2" /> Back to Safety
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}