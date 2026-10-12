"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, LogOut, User as UserIcon, Check } from "lucide-react";
import { SessionUser } from "@/types";

interface NavbarProps {
  user: SessionUser;
}

export const Navbar: React.FC<NavbarProps> = ({ user }) => {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    async function fetchNotifs() {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const json = await res.json();
          setNotifications(json.data.notifications || []);
          setUnreadCount(json.data.unreadCount || 0);
        }
      } catch (err) {
        // silent
      }
    }
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function markAllRead() {
    await fetch("/api/notifications/all/read", { method: "POST" });
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold text-slate-800">
          Smart Food Supply Chain & Waste Reduction System
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-emerald-600 hover:underline flex items-center gap-1 font-medium"
                  >
                    <Check className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-50 mt-2">
                {notifications.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">No notifications yet</p>
                ) : (
                  notifications.slice(0, 8).map((n) => (
                    <div
                      key={n.id}
                      className={`py-2.5 px-2 text-xs rounded-lg transition-colors ${
                        n.isRead ? "text-slate-600 hover:bg-slate-50" : "bg-emerald-50/50 text-slate-900 font-medium"
                      }`}
                    >
                      <p className="font-semibold text-slate-900">{n.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{n.message}</p>
                      <span className="text-[9px] text-slate-400 block mt-1">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Info & Logout */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-slate-900">{user.name}</p>
            <p className="text-[10px] text-slate-500 font-medium capitalize">
              {user.role.toLowerCase().replace(/_/g, " ")}
            </p>
          </div>

          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};