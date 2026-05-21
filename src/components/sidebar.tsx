"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingCart, Package, Receipt, Truck, Shield, ClipboardList, Users, LogOut, ChevronDown, ArrowDownUp } from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";

const groups = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Commerce",
    items: [
      { href: "/pos", label: "POS Terminal", icon: ShoppingCart },
      { href: "/orders", label: "Purchase Orders", icon: ClipboardList },
      { href: "/transactions", label: "Transactions", icon: Receipt },
      { href: "/buyers", label: "Buyers", icon: Users },
    ],
  },
  {
    label: "Stock",
    items: [
      { href: "/inventory", label: "Inventory", icon: Package },
      { href: "/suppliers", label: "Suppliers", icon: Truck },
      { href: "/restocks", label: "Restocks", icon: ArrowDownUp },
    ],
  },
  {
    label: "Monitoring",
    items: [
      { href: "/audit-log", label: "Audit Logs", icon: Shield },
    ],
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function toggleGroup(label: string) {
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  return (
    <nav className="fixed left-0 top-0 h-full w-[260px] bg-[#0e212c] flex flex-col z-50">
      <div className="px-6 py-6 border-b border-white/10">
        <h1 className="text-xl font-bold text-white tracking-tight">
          <span className="text-[#fd761a]">A</span>nvil<span className="text-[#fd761a]">OS</span>
        </h1>
        <p className="text-xs text-white/50 mt-0.5 uppercase tracking-widest font-medium">Hardware & Supply</p>
      </div>
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {groups.map((group) => {
          const isCollapsed = collapsed[group.label];
          return (
            <div key={group.label}>
              <button onClick={() => toggleGroup(group.label)}
                className="flex items-center justify-between w-full px-6 py-1.5 text-[10px] font-bold text-white/30 uppercase tracking-[0.15em] hover:text-white/50 transition-colors">
                {group.label}
                <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`} />
              </button>
              {!isCollapsed && (
                <div className="mt-0.5 space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link key={item.href} href={item.href}
                        className={`flex items-center gap-3 mx-3 px-4 py-2.5 text-sm font-medium rounded-sm transition-all duration-200 ${
                          isActive
                            ? "bg-[#fd761a]/15 text-[#fd761a] border-l-[3px] border-[#fd761a]"
                            : "text-white/60 hover:text-white hover:bg-white/5"
                        }`}>
                        <item.icon className="h-5 w-5 shrink-0" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="border-t border-white/10 py-4 space-y-0.5">
        <button onClick={() => signOut({ callbackUrl: "/login" })} className="w-[calc(100%-24px)] mx-3 flex items-center gap-3 px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-sm transition-all">
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </nav>
  );
}
