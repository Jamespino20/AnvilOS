/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: June 13, 2026
*/

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FolderTree,
  Receipt,
  Truck,
  Shield,
  ClipboardList,
  Users,
  LogOut,
  ChevronDown,
  ArrowDownUp,
  PanelLeftClose,
  PanelLeft,
  Wallet,
  Tag,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { useSidebarBadges } from "@/components/sidebar-badges";
import { canAccessPath } from "@/lib/access";
import { motion, AnimatePresence } from "framer-motion";

const groups = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/finance", label: "Finance", icon: Wallet },
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
      { href: "/categories", label: "Categories", icon: FolderTree },
      { href: "/brands", label: "Brands", icon: Tag },
      { href: "/suppliers", label: "Suppliers", icon: Truck },
      { href: "/restocks", label: "Restocks", icon: ArrowDownUp },
    ],
  },
  {
    label: "Monitoring",
    items: [{ href: "/audit-log", label: "Audit Logs", icon: Shield }],
  },
  {
    label: "Administration",
    items: [{ href: "/users", label: "Users", icon: Users }],
  },
];

const allNavItems = groups.flatMap((g) => g.items);

interface Props {
  collapsed: boolean;
  onToggle: () => void;
  role?: string | null;
}

export function DashboardSidebar({ collapsed, onToggle, role }: Props) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const { lowStockCount, pendingRestockCount, pendingPOCount } =
    useSidebarBadges();

  function toggleGroup(label: string) {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  function getBadge(href: string) {
    if (href === "/inventory" && lowStockCount > 0) return lowStockCount;
    if (href === "/restocks" && pendingRestockCount > 0)
      return pendingRestockCount;
    if (href === "/orders" && pendingPOCount > 0) return pendingPOCount;
    return 0;
  }

  const sidebarContent = (
    <nav
      className={cn(
        "h-full bg-[#0e212c] flex flex-col transition-all duration-300 relative z-50 shadow-2xl",
        collapsed ? "w-[64px]" : "w-[260px]",
      )}
    >
      <div
        className={cn(
          "px-6 py-6 border-b border-white/10 flex items-center",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-3">
            <img
              src="/images/CWLHardware_Logo.png"
              alt="CWL Hardware"
              className="h-8 w-auto brightness-0 invert"
            />
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 text-white/40 hover:text-white transition-colors"
          title={collapsed ? "Open sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeft className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* ─── Expanded mode ─── */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {groups.map((group) => {
            const items = group.items.filter((item) =>
              canAccessPath(role, item.href),
            );
            if (items.length === 0) return null;
            const isOpen = openGroups[group.label] !== false;
            return (
              <div key={group.label}>
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="flex items-center justify-between w-full px-6 py-1.5 text-[10px] font-bold text-white/30 uppercase tracking-[0.15em] hover:text-white/50 transition-colors"
                >
                  {group.label}
                  <ChevronDown
                    className={`h-3 w-3 transition-transform duration-200 ${isOpen ? "" : "-rotate-90"}`}
                  />
                </button>
                {isOpen && (
                  <div className="mt-0.5 space-y-0.5">
                    {items.map((item) => {
                      const badge = getBadge(item.href);
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => {
                            if (window.innerWidth < 768) onToggle();
                          }}
                          className={cn(
                            "flex items-center gap-3 mx-3 px-4 py-2.5 text-sm font-medium rounded-sm transition-all duration-200",
                            isActive
                              ? "bg-[#fd761a]/15 text-[#fd761a] border-l-[3px] border-[#fd761a]"
                              : "text-white/60 hover:text-white hover:bg-white/5",
                          )}
                        >
                          <item.icon className="h-5 w-5 shrink-0" />
                          <span className="flex-1">{item.label}</span>
                          {badge > 0 && (
                            <span className="bg-[#fd761a] text-white text-[10px] font-bold min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center leading-none">
                              {badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Collapsed / Icon-only mode ─── */}
      {collapsed && (
        <div className="flex-1 overflow-y-auto py-4 space-y-1">
          {allNavItems
            .filter((item) => canAccessPath(role, item.href))
            .map((item) => {
              const badge = getBadge(item.href);
              const isActive = pathname === item.href;
              return (
                <div key={item.href} className="relative group">
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center justify-center mx-2 py-3 rounded-sm transition-all duration-200",
                      isActive
                        ? "bg-[#fd761a]/15 text-[#fd761a]"
                        : "text-white/60 hover:text-white hover:bg-white/5",
                    )}
                  >
                    <div className="relative">
                      <item.icon className="h-5 w-5" />
                      {badge > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-[#fd761a] text-white text-[9px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center leading-none">
                          {badge > 99 ? "99+" : badge}
                        </span>
                      )}
                    </div>
                  </Link>
                  {/* Tooltip on hover */}
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-[#0e212c] border border-white/10 rounded-md text-xs font-medium text-white whitespace-nowrap shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-[100]">
                    {item.label}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      <div className="border-t border-white/10 py-4 space-y-0.5">
        <div className="relative group">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className={cn(
              "w-[calc(100%-24px)] mx-3 flex items-center gap-3 px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-sm transition-all",
              collapsed && "justify-center mx-2 w-auto",
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && "Sign Out"}
          </button>
          {collapsed && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-[#0e212c] border border-white/10 rounded-md text-xs font-medium text-white whitespace-nowrap shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-[100]">
              Sign Out
            </div>
          )}
        </div>
      </div>
    </nav>
  );

  return (
    <>
      <div className="hidden md:flex fixed left-0 top-0 h-full z-50 overflow-hidden">
        {sidebarContent}
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {!collapsed && (
          <div className="md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onToggle}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] z-[70]"
            >
              {sidebarContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
