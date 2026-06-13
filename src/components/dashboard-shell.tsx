"use client";

import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/sidebar";
import { DashboardTopbar } from "@/components/topbar";
import { InactivityGuard } from "@/components/inactivity-guard";
import { cn } from "@/lib/utils";

interface Props {
  children: React.ReactNode;
  user: { name?: string | null; email?: string | null; imageUrl?: string | null; role?: string | null };
  unreadCount: number;
}

export function DashboardShell({ children, user, unreadCount }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Handle auto-collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex min-h-screen bg-background" style={{ overflowX: "clip" }}>
      <DashboardSidebar collapsed={!sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} role={user.role} />
      <div className={cn(
        "flex-1 flex flex-col min-h-screen transition-all duration-300 min-w-0",
        sidebarOpen ? "md:ml-[260px]" : "md:ml-[64px]"
      )}>
        <DashboardTopbar user={user} unreadCount={unreadCount} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto" style={{ overflowX: "clip" }}>
          {children}
        </main>
      </div>
      <InactivityGuard />
    </div>
  );
}




