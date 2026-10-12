import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | number | null | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatDateOnly(date: Date | string | number | null | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export function formatTimeRemaining(expiryDate: Date | string): {
  text: string;
  isUrgent: boolean;
  isExpired: boolean;
} {
  const now = new Date().getTime();
  const expiry = new Date(expiryDate).getTime();
  const diffMs = expiry - now;

  if (diffMs <= 0) {
    return { text: "Expired", isUrgent: true, isExpired: true };
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours < 1) {
    return { text: `${minutes}m remaining`, isUrgent: true, isExpired: false };
  }
  if (hours < 6) {
    return { text: `${hours}h ${minutes}m remaining`, isUrgent: true, isExpired: false };
  }
  if (hours < 24) {
    return { text: `${hours} hours remaining`, isUrgent: false, isExpired: false };
  }

  const days = Math.floor(hours / 24);
  return { text: `${days} day${days > 1 ? "s" : ""} remaining`, isUrgent: false, isExpired: false };
}

export function getStatusBadgeVariant(status: string): {
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
} {
  switch (status) {
    case "DRAFT":
      return { color: "text-slate-700", bgColor: "bg-slate-100", borderColor: "border-slate-300", label: "Draft" };
    case "SUBMITTED":
      return { color: "text-blue-700", bgColor: "bg-blue-100", borderColor: "border-blue-300", label: "Submitted" };
    case "APPROVED":
      return { color: "text-emerald-700", bgColor: "bg-emerald-100", borderColor: "border-emerald-300", label: "Approved" };
    case "REJECTED":
      return { color: "text-rose-700", bgColor: "bg-rose-100", borderColor: "border-rose-300", label: "Rejected" };
    case "REQUESTED":
      return { color: "text-amber-700", bgColor: "bg-amber-100", borderColor: "border-amber-300", label: "Requested" };
    case "MATCHED":
      return { color: "text-indigo-700", bgColor: "bg-indigo-100", borderColor: "border-indigo-300", label: "Matched" };
    case "ASSIGNED":
      return { color: "text-purple-700", bgColor: "bg-purple-100", borderColor: "border-purple-300", label: "Assigned" };
    case "PICKUP_IN_PROGRESS":
      return { color: "text-cyan-700", bgColor: "bg-cyan-100", borderColor: "border-cyan-300", label: "Pickup In Progress" };
    case "PICKED_UP":
      return { color: "text-teal-700", bgColor: "bg-teal-100", borderColor: "border-teal-300", label: "Picked Up" };
    case "IN_TRANSIT":
      return { color: "text-orange-700", bgColor: "bg-orange-100", borderColor: "border-orange-300", label: "In Transit" };
    case "DELIVERED":
      return { color: "text-lime-700", bgColor: "bg-lime-100", borderColor: "border-lime-300", label: "Delivered" };
    case "COMPLETED":
      return { color: "text-green-800", bgColor: "bg-green-100", borderColor: "border-green-300", label: "Completed" };
    case "DISPUTED":
      return { color: "text-red-700", bgColor: "bg-red-100", borderColor: "border-red-300", label: "Disputed" };
    case "EXPIRED":
      return { color: "text-zinc-700", bgColor: "bg-zinc-200", borderColor: "border-zinc-400", label: "Expired" };
    default:
      return { color: "text-slate-700", bgColor: "bg-slate-100", borderColor: "border-slate-300", label: status };
  }
}