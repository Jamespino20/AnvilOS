"use client";

import { useState } from "react";
import { DashboardSidebar } from "@/components/sidebar";
import { DashboardTopbar } from "@/components/topbar";
import { InactivityGuard } from "@/components/inactivity-guard";

interface Props {
  children: React.ReactNode;
  user: { name?: string | null; email?: string | null };
  unreadCount: number;
}

export function DashboardShell({ children, user, unreadCount }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#e2e8f0]">
      <DashboardSidebar collapsed={!sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? "ml-[260px]" : "ml-[0px]"}`}>
        <DashboardTopbar user={user} unreadCount={unreadCount} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
      <InactivityGuard />
    </div>
  );
}
