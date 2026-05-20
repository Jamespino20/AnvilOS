"use client";

import { Bell, Settings, HelpCircle, Search } from "lucide-react";

interface TopbarProps {
  user: { name?: string | null; email?: string | null };
}

export function DashboardTopbar({ user }: TopbarProps) {
  return (
    <header className="bg-surface border-b border-outline-variant flex items-center justify-between w-full px-6 h-16 sticky top-0 z-40">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant/50" />
        <input
          type="text"
          placeholder="Search SKU, Product, or Transaction ID..."
          className="w-full pl-10 pr-4 py-2 border border-outline rounded bg-white text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-on-surface-variant/50"
        />
      </div>
      <div className="flex items-center gap-2 ml-4">
        <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded transition-colors">
          <Bell className="h-5 w-5" />
        </button>
        <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded transition-colors">
          <Settings className="h-5 w-5" />
        </button>
        <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded transition-colors">
          <HelpCircle className="h-5 w-5" />
        </button>
        <div className="ml-4 pl-4 border-l border-outline-variant flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-xs font-bold">
            {user.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <span className="text-sm font-medium text-on-surface hidden md:block">{user.name}</span>
        </div>
      </div>
    </header>
  );
}
