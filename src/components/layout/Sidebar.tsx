"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PlusCircle,
  Package,
  HeartHandshake,
  Truck,
  LineChart,
  Bell,
  User,
  Shield,
  FileText,
  MapPin,
  Clock,
  Settings,
  Users,
  Building2,
  Share2,
  CheckCircle,
  Inbox,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserRole } from "@/types";

interface SidebarProps {
  role: UserRole;
  userName: string;
  orgName?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ role, userName, orgName }) => {
  const pathname = usePathname();

  const providerLinks = [
    { href: "/provider", label: "Dashboard", icon: LayoutDashboard },
    { href: "/provider/donations/create", label: "Create Donation", icon: PlusCircle },
    { href: "/provider/donations", label: "My Donations", icon: Package },
    { href: "/provider/matching", label: "NGO Matching", icon: HeartHandshake },
    { href: "/provider/deliveries", label: "Track Deliveries", icon: Truck },
    { href: "/provider/waste", label: "Kitchen Waste Log", icon: AlertTriangle },
    { href: "/provider/impact", label: "Impact Analytics", icon: LineChart },
    { href: "/provider/notifications", label: "Notifications", icon: Bell },
    { href: "/provider/profile", label: "Profile", icon: User },
  ];

  const ngoLinks = [
    { href: "/ngo", label: "Dashboard", icon: LayoutDashboard },
    { href: "/ngo/food", label: "Available Food", icon: Package },
    { href: "/ngo/requests", label: "My Requests", icon: Inbox },
    { href: "/ngo/deliveries", label: "Active Deliveries", icon: Truck },
    { href: "/ngo/received", label: "Received History", icon: CheckCircle },
    { href: "/ngo/waste", label: "Warehouse Waste Log", icon: AlertTriangle },
    { href: "/ngo/feedback", label: "Feedback & Ratings", icon: Share2 },
    { href: "/ngo/impact", label: "Impact", icon: LineChart },
    { href: "/ngo/notifications", label: "Notifications", icon: Bell },
    { href: "/ngo/profile", label: "Profile", icon: User },
  ];

  const distributorLinks = [
    { href: "/distributor", label: "Dashboard", icon: LayoutDashboard },
    { href: "/distributor/pickups", label: "Pickup Tasks", icon: Package },
    { href: "/distributor/deliveries", label: "Active Deliveries", icon: Truck },
    { href: "/distributor/location", label: "Live GPS Broadcaster", icon: MapPin },
    { href: "/distributor/history", label: "Delivery History", icon: Clock },
    { href: "/distributor/reliability", label: "Reliability Score", icon: LineChart },
    { href: "/distributor/notifications", label: "Notifications", icon: Bell },
    { href: "/distributor/profile", label: "Profile", icon: User },
  ];

  const adminLinks = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/donations", label: "Review Donations", icon: Package },
    { href: "/admin/requests", label: "Food Requests", icon: Inbox },
    { href: "/admin/matching", label: "Matching & Dispatch", icon: HeartHandshake },
    { href: "/admin/deliveries", label: "Deliveries", icon: Truck },
    { href: "/admin/tracking", label: "Live Fleet Map", icon: MapPin },
    { href: "/admin/waste", label: "Waste & Spoilage Ledger", icon: AlertTriangle },
    { href: "/admin/users", label: "User Directory", icon: Users },
    { href: "/admin/providers", label: "Providers", icon: Building2 },
    { href: "/admin/ngos", label: "NGOs", icon: HeartHandshake },
    { href: "/admin/distributors", label: "Distributors", icon: Truck },
    { href: "/admin/impact", label: "Global ESG Impact", icon: LineChart },
    { href: "/admin/audit-logs", label: "Audit Trail", icon: Shield },
    { href: "/admin/settings", label: "System Settings", icon: Settings },
  ];

  let links = providerLinks;
  if (role === "NGO") links = ngoLinks;
  else if (role === "DISTRIBUTOR") links = distributorLinks;
  else if (role === "ADMIN") links = adminLinks;

  const roleLabels: Record<UserRole, string> = {
    FOOD_PROVIDER: "Food Provider Portal",
    NGO: "NGO / Food Bank Portal",
    DISTRIBUTOR: "Logistics & Driver Portal",
    ADMIN: "System Administrator",
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-screen flex flex-col border-r border-slate-800 shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-emerald-900/30">
            🌱
          </div>
          <div>
            <span className="text-sm font-bold text-white tracking-tight block">
              Smart Food Chain
            </span>
            <span className="text-[11px] font-medium text-emerald-400 block">
              Waste Reduction Platform
            </span>
          </div>
        </Link>

        <div className="mt-4 px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700/60">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
            {roleLabels[role]}
          </span>
          <span className="text-xs font-semibold text-white truncate block mt-0.5">
            {orgName || userName}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all",
                isActive
                  ? "bg-emerald-600 text-white font-semibold shadow-sm"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
              )}
            >
              <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-white" : "text-slate-400")} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Profile info */}
      <div className="p-4 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
        <div className="truncate">
          <p className="text-white font-medium text-xs truncate">{userName}</p>
          <p className="text-[11px] text-emerald-400 capitalize">{role.toLowerCase().replace(/_/g, " ")}</p>
        </div>
        <span className="w-2 h-2 rounded-full bg-emerald-500" title="Online" />
      </div>
    </aside>
  );
};