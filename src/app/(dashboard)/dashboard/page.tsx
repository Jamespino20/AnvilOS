/*
App Name: AnvilOS
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: 
*/

import { getDashboardKpis, getRevenueTrend, getTransactions } from "@/actions";
import { PageHeader } from "@/components/ui/page-header";
import { DashboardExport } from "@/components/dashboard-export";
import { TrendingUp, Receipt, Package, AlertTriangle, DollarSign, ArrowUpRight } from "lucide-react";

export default async function DashboardPage() {
  const [kpis, revenueTrend, recentTransactions] = await Promise.all([
    getDashboardKpis(),
    getRevenueTrend(7),
    getTransactions({ status: "Completed" }),
  ]);

  const maxRevenue = Math.max(...revenueTrend.map((d) => Number(d.total)), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Dashboard" subtitle="Real-time operational overview" />
        <DashboardExport data={{ dailySales: kpis.dailySales, totalTransactions: kpis.totalTransactions, totalProducts: kpis.totalProducts, lowStockCount: kpis.lowStockCount, revenueTrend, recentTransactions: recentTransactions as any[] }} />
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* KPI Cards */}
        {[
          { icon: TrendingUp, label: "Gross Sales (Today)", value: `₱${kpis.dailySales.toLocaleString()}`, sub: `▲ Daily transactions: ${kpis.transactionCount}`, color: "from-emerald-500 to-teal-600", bg: "bg-emerald-50" },
          { icon: Receipt, label: "Total Transactions", value: kpis.totalTransactions.toLocaleString(), sub: "All time", color: "from-blue-500 to-indigo-600", bg: "bg-blue-50" },
          { icon: Package, label: "Active Products", value: kpis.totalProducts.toLocaleString(), sub: "SKUs in system", color: "from-violet-500 to-purple-600", bg: "bg-violet-50" },
          { icon: AlertTriangle, label: "Low Stock Alerts", value: kpis.lowStockCount.toLocaleString(), sub: "Below minimum threshold", color: "from-rose-500 to-pink-600", bg: "bg-rose-50" },
        ].map((card, i) => (
          <div key={i} className="col-span-12 md:col-span-3 bg-white/90 backdrop-blur-sm rounded-xl border border-[#e2e8f0] p-5 hover:shadow-lg hover:shadow-black/5 hover:bg-white transition-all duration-300 hover:-translate-y-0.5 group">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider group-hover:text-[#fd761a] transition-colors">{card.label}</span>
              <div className={`w-9 h-9 rounded-lg ${card.bg} group-hover:scale-110 transition-transform duration-300 flex items-center justify-center`}>
                <card.icon className="h-4 w-4 text-[#0e212c]" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#0e212c] tracking-tight">{card.value}</p>
            <p className="text-xs text-[#94a3b8] mt-1.5 flex items-center gap-1">{card.sub}</p>
          </div>
        ))}

        {/* Revenue Chart */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-xl border border-[#e2e8f0] p-6 hover:shadow-lg hover:shadow-black/5 transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-[#0e212c]">Revenue Trend (7 Days)</h3>
            <span className="text-xs text-[#94a3b8] flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-emerald-500" /> +12.5% vs last week
            </span>
          </div>
          <div className="flex items-end justify-between h-52 px-2">
            {revenueTrend.map((day, i) => {
              const height = Math.max((Number(day.total) / maxRevenue) * 100, 4);
              return (
                <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
                  <div className="relative">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#0e212c] text-white text-[11px] font-medium px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                      ₱{Number(day.total).toLocaleString()}
                    </div>
                    <div
                      className="w-8 rounded-t-lg bg-gradient-to-t from-[#fd761a]/80 to-[#fd761a]/30 hover:from-[#fd761a] hover:to-[#fd761a]/50 transition-all duration-300 cursor-pointer"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="text-xs text-[#94a3b8] font-medium">{day.date}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-xl border border-[#e2e8f0] flex flex-col hover:shadow-lg hover:shadow-black/5 transition-all duration-300">
          <div className="px-6 py-4 border-b border-[#e2e8f0] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0e212c]">Recent Transactions</h3>
            <span className="text-[10px] font-medium text-[#fd761a] uppercase tracking-wider">{recentTransactions.length} total</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {recentTransactions.slice(0, 6).map((t) => (
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#f8fafc] transition-all duration-200 group cursor-pointer">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#fd761a]/10 to-[#fd761a]/5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <DollarSign className="h-4 w-4 text-[#fd761a]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0e212c] truncate">{t.buyerName}</p>
                  <p className="text-[11px] text-[#94a3b8]">{t.transactionType.replace("Sale", "Sale ")} · ₱{Number(t.grandTotal || 0).toLocaleString()}</p>
                </div>
                <span className="text-[11px] text-[#94a3b8] font-medium">{new Date(t.transactionDate).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            ))}
            {recentTransactions.length === 0 && (
              <p className="text-sm text-[#94a3b8] text-center py-8">No recent transactions</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
