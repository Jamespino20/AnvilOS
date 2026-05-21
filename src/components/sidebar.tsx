"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingCart, Package, Receipt, Truck, Shield, Bell, LifeBuoy, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pos", label: "POS Terminal", icon: ShoppingCart },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/transactions", label: "Transactions", icon: Receipt },
  { href: "/suppliers", label: "Suppliers", icon: Truck },
  { href: "/audit-log", label: "Audit Logs", icon: Shield },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <nav className="fixed left-0 top-0 h-full w-[260px] bg-[#0e212c] flex flex-col z-50">
      <div className="px-6 py-6 border-b border-white/10">
        <h1 className="text-xl font-bold text-white tracking-tight">
          <span className="text-[#fd761a]">A</span>nvil<span className="text-[#fd761a]">OS</span>
        </h1>
        <p className="text-xs text-white/50 mt-0.5 uppercase tracking-widest font-medium">Hardware & Supply</p>
      </div>
      <div className="flex-1 overflow-y-auto py-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 mx-3 px-4 py-2.5 text-sm font-medium rounded-sm transition-all duration-200 ${
                isActive
                  ? "bg-[#fd761a]/15 text-[#fd761a] border-l-[3px] border-[#fd761a]"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </div>
      <div className="border-t border-white/10 py-4 space-y-0.5">
        <Link href="#" className="flex items-center gap-3 mx-3 px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-sm transition-all">
          <LifeBuoy className="h-5 w-5" />
          Support
        </Link>
        <button onClick={() => signOut({ callbackUrl: "/login" })} className="w-[calc(100%-24px)] mx-3 flex items-center gap-3 px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-sm transition-all">
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </nav>
  );
}
