"use client";

import { useState } from "react";
import { Bell, Settings, HelpCircle, PanelLeft } from "lucide-react";
import { NotificationModal } from "@/components/notification-modal";
import { SettingsModal } from "@/components/settings-modal";
import { SupportModal } from "@/components/support-modal";

interface TopbarProps {
  user: { name?: string | null; email?: string | null; imageUrl?: string | null };
  unreadCount?: number;
  onToggleSidebar?: () => void;
}

export function DashboardTopbar({
  user,
  unreadCount = 0,
  onToggleSidebar,
}: TopbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  return (
    <>
      <header className="bg-white/80 backdrop-blur-xl border-b border-[#e2e8f0] flex items-center justify-between w-full px-6 h-16 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 text-[#64748b] hover:bg-[#f1f5f9] rounded-lg transition-all"
              title="Toggle Sidebar"
            >
              <PanelLeft className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowNotifications(true)}
            className="relative p-2.5 text-[#64748b] hover:bg-[#f1f5f9] rounded-lg transition-all duration-200 hover:text-[#0e212c]"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] flex items-center justify-center bg-rose-500 text-white text-[10px] font-bold rounded-full shadow-sm ring-2 ring-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2.5 text-[#64748b] hover:bg-[#f1f5f9] rounded-lg transition-all duration-200 hover:text-[#0e212c]"
          >
            <Settings className="h-5 w-5" />
          </button>
          <button
            onClick={() => setShowSupport(true)}
            className="p-2.5 text-[#64748b] hover:bg-[#f1f5f9] rounded-lg transition-all duration-200 hover:text-[#0e212c]"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
          <div className="ml-3 pl-4 border-l border-[#e2e8f0] flex items-center gap-3">
            {user.imageUrl ? (
              <img src={user.imageUrl} alt="Profile" className="w-8 h-8 rounded-lg object-cover shadow-sm" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#fd761a] to-[#e56600] text-white dark:bg-white/10 dark:text-white flex items-center justify-center text-xs font-bold shadow-sm">
                {user.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-[#0e212c] leading-tight">
                {user.name || "User"}
              </p>
              <p className="text-[11px] text-[#64748b] leading-tight">
                {user.email || ""}
              </p>
            </div>
          </div>
        </div>
      </header>
      <NotificationModal
        open={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
      />
      <SupportModal open={showSupport} onClose={() => setShowSupport(false)} />
    </>
  );
}




