"use client";

import Link from "next/link";
import { Bell, Settings, HelpCircle, PanelLeft } from "lucide-react";

interface TopbarProps {
  user: { name?: string | null; email?: string | null };
  unreadCount?: number;
  onToggleSidebar?: () => void;
}

export function DashboardTopbar({ user, unreadCount = 0, onToggleSidebar }: TopbarProps) {
  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-[#e2e8f0] flex items-center justify-between w-full px-6 h-16 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        {onToggleSidebar && (
          <button onClick={onToggleSidebar} className="p-2 text-[#64748b] hover:bg-[#f1f5f9] rounded-lg lg:hidden transition-all">
            <PanelLeft className="h-5 w-5" />
          </button>
        )}
        <h1 className="text-lg font-bold text-[#0e212c] tracking-tight">
          <span className="text-[#fd761a]">A</span>nvil<span className="text-[#fd761a]">OS</span>
        </h1>
      </div>
      <div className="flex items-center gap-1">
        <Link href="/notifications" className="relative p-2.5 text-[#64748b] hover:bg-[#f1f5f9] rounded-lg transition-all duration-200 hover:text-[#0e212c]">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] flex items-center justify-center bg-rose-500 text-white text-[10px] font-bold rounded-full shadow-sm ring-2 ring-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>
        <Link href="/settings" className="p-2.5 text-[#64748b] hover:bg-[#f1f5f9] rounded-lg transition-all duration-200 hover:text-[#0e212c]">
          <Settings className="h-5 w-5" />
        </Link>
        <Link href="/support" className="p-2.5 text-[#64748b] hover:bg-[#f1f5f9] rounded-lg transition-all duration-200 hover:text-[#0e212c]">
          <HelpCircle className="h-5 w-5" />
        </Link>
        <div className="ml-3 pl-4 border-l border-[#e2e8f0] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#fd761a] to-[#e56600] text-white flex items-center justify-center text-xs font-bold shadow-sm">
            {user.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <span className="text-sm font-semibold text-[#0e212c] hidden md:block">{user.name}</span>
        </div>
      </div>
    </header>
  );
}
