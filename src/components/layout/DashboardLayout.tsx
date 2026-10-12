import React from "react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { SessionUser } from "@/types";

interface DashboardLayoutProps {
  user: SessionUser;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ user, children }) => {
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
      <Sidebar role={user.role} userName={user.name} orgName={user.organizationName} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar user={user} />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
};