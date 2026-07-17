/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: July 11, 2026
*/

import {
  getDashboardKpis,
  getRevenueTrend,
  getTransactions,
  getDashboardCharts,
} from "@/actions";
import { PageHeader } from "@/components/ui/page-header";
import { DashboardExport } from "@/components/dashboard-export";
import { RevenueChart, TxnTypeChart, StockChart } from "@/components/charts";
import {
  TrendingUp,
  Receipt,
  Package,
  AlertTriangle,
  DollarSign,
  ArrowUpRight,
  Warehouse,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/access";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user || !isAdminRole((session.user as any)?.role)) {
    redirect("/pos");
  }

  let kpis, revenueTrend, recentTransactions, charts;
  try {
    [kpis, revenueTrend, recentTransactions, charts] = await Promise.all([
      getDashboardKpis(),
      getRevenueTrend(7),
      getTransactions({ status: "Completed" }),
      getDashboardCharts(),
    ]);
  } catch {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-[#0e212c]">
            Database Unavailable
          </p>
          <p className="text-sm text-[#94a3b8]">
            Please try again in a few moments.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Dashboard"
          subtitle="Real-time operational overview"
        />
        <DashboardExport
          data={{
            dailySales: kpis.dailySales,
            totalTransactions: kpis.totalTransactions,
            totalProducts: kpis.totalProducts,
            lowStockCount: kpis.lowStockCount,
            revenueTrend,
            recentTransactions: recentTransactions as any[],
          }}
        />
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* KPI Cards */}
        {[
          {
            icon: TrendingUp,
            label: "Gross Sales (Today)",
            value: kpis.dailySales.toLocaleString("en-PH", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
            sub: `▲ Daily txn: ${kpis.transactionCount}`,
            color: "from-emerald-500 to-teal-600",
            bg: "bg-emerald-50",
          },
          {
            icon: Warehouse,
            label: "Total Inventory Value",
            value: kpis.totalInventoryValue.toLocaleString("en-PH", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
            sub: " ",
            color: "from-amber-500 to-orange-600",
            bg: "bg-amber-50",
          },
          {
            icon: Receipt,
            label: "Total Transactions",
            value: kpis.totalTransactions.toLocaleString(),
            sub: "All time",
            color: "from-blue-500 to-indigo-600",
            bg: "bg-blue-50",
          },
          {
            icon: Package,
            label: "Active Products",
            value: kpis.totalProducts.toLocaleString(),
            sub: "SKUs in system",
            color: "from-violet-500 to-purple-600",
            bg: "bg-violet-50",
          },
          {
            icon: AlertTriangle,
            label: "Low Stock Alerts",
            value: kpis.lowStockCount.toLocaleString(),
            sub: "Below threshold",
            color: "from-rose-500 to-pink-600",
            bg: "bg-rose-50",
          },
        ].map((card, i) => (
          <div
            key={i}
            className="col-span-12 sm:col-span-6 md:col-span-4 bg-white/90 backdrop-blur-sm rounded-xl border border-[#e2e8f0] p-5 hover:shadow-lg hover:shadow-black/5 hover:bg-white transition-all duration-300 hover:-translate-y-0.5 group"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider group-hover:text-[#fd761a] transition-colors">
                {card.label}
              </span>
              <div
                className={`w-9 h-9 rounded-lg ${card.bg} group-hover:scale-110 transition-transform duration-300 flex items-center justify-center`}
              >
                <card.icon className="h-4 w-4 text-[#0e212c]" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#0e212c] tracking-tight">
              {card.value}
            </p>
            <p className="text-xs text-[#94a3b8] mt-1.5 flex items-center gap-1">
              {card.sub}
            </p>
          </div>
        ))}

        {/* Revenue Chart */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-xl border border-[#e2e8f0] p-6 hover:shadow-lg hover:shadow-black/5 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#0e212c]">
              Revenue Trend (7 Days)
            </h3>
            <span className="text-xs text-[#94a3b8] flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-emerald-500" /> +12.5% vs
              last week
            </span>
          </div>
          <div className="h-60">
            <RevenueChart data={revenueTrend} />
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-xl border border-[#e2e8f0] flex flex-col hover:shadow-lg hover:shadow-black/5 transition-all duration-300">
          <div className="px-6 py-4 border-b border-[#e2e8f0] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0e212c]">
              Recent Transactions
            </h3>
            <span className="text-[10px] font-medium text-[#fd761a] uppercase tracking-wider">
              {recentTransactions.length} total
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {recentTransactions.slice(0, 6).map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#f8fafc] transition-all duration-200 group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#fd761a]/10 to-[#fd761a]/5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <DollarSign className="h-4 w-4 text-[#fd761a]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0e212c] truncate">
                    {t.buyerName}
                  </p>
                  <p className="text-[11px] text-[#94a3b8]">
                    {t.transactionType.replace("Sale", "Sale ")} ·{" "}
                    {Number(t.grandTotal || 0).toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <span className="text-[11px] text-[#94a3b8] font-medium text-right leading-tight">
                  {new Date(t.transactionDate).toLocaleString("en-PH", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Asia/Manila",
                  })}
                </span>
              </div>
            ))}
            {recentTransactions.length === 0 && (
              <p className="text-sm text-[#94a3b8] text-center py-8">
                No recent transactions
              </p>
            )}
          </div>
        </div>

        {/* Transaction Types Doughnut */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-4 bg-white rounded-xl border border-[#e2e8f0] p-6 hover:shadow-lg hover:shadow-black/5 transition-all duration-300">
          <h3 className="text-sm font-bold text-[#0e212c] mb-4">
            Transaction Types
          </h3>
          <div className="h-56 flex items-center justify-center">
            <TxnTypeChart data={charts.transactionTypes} />
          </div>
        </div>

        {/* Stock Status Doughnut */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-4 bg-white rounded-xl border border-[#e2e8f0] p-6 hover:shadow-lg hover:shadow-black/5 transition-all duration-300">
          <h3 className="text-sm font-bold text-[#0e212c] mb-4">
            Stock Status
          </h3>
          <div className="h-56 flex items-center justify-center">
            <StockChart data={charts.stockStatus} />
          </div>
        </div>

        {/* KPI Mini Summary */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-xl border border-[#e2e8f0] p-6 hover:shadow-lg hover:shadow-black/5 transition-all duration-300">
          <h3 className="text-sm font-bold text-[#0e212c] mb-4">
            Quick Summary
          </h3>
          <div className="space-y-4">
            {[
              {
                label: "Today's Sales",
                value: kpis.dailySales.toLocaleString("en-PH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }),
                color: "bg-emerald-500",
              },
              {
                label: "Active Products",
                value: kpis.totalProducts.toLocaleString(),
                color: "bg-blue-500",
              },
              {
                label: "Low Stock Items",
                value: kpis.lowStockCount.toLocaleString(),
                color: "bg-amber-500",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between"
              >
                <span className="text-sm text-[#64748b]">{item.label}</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className="text-sm font-bold text-[#0e212c]">
                    {item.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
