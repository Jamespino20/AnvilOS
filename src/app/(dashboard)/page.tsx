import { getDashboardKpis, getRevenueTrend, getTransactions } from "@/actions";
import { TrendingUp, Receipt, Package, AlertTriangle, DollarSign } from "lucide-react";

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
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Overview</h1>
          <p className="text-sm text-on-surface-variant mt-1">Live metrics and system status</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-outline text-sm rounded hover:bg-surface-container-low transition-colors">Export Report</button>
          <button className="px-4 py-2 bg-secondary text-on-secondary text-sm rounded hover:bg-secondary/90 transition-colors">New Sale</button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 md:col-span-3 bg-white border border-outline rounded p-4">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Gross Sales (Today)</span>
            <TrendingUp className="h-5 w-5 text-secondary" />
          </div>
          <p className="text-2xl font-bold">₱{kpis.dailySales.toLocaleString()}</p>
          <p className="text-xs text-success mt-1 flex items-center gap-1">▲ Daily transactions: {kpis.transactionCount}</p>
        </div>

        <div className="col-span-12 md:col-span-3 bg-white border border-outline rounded p-4">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Transactions</span>
            <Receipt className="h-5 w-5 text-primary-container" />
          </div>
          <p className="text-2xl font-bold">{kpis.totalTransactions}</p>
          <p className="text-xs text-on-surface-variant mt-1">Total all time</p>
        </div>

        <div className="col-span-12 md:col-span-3 bg-white border border-outline rounded p-4">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Products</span>
            <Package className="h-5 w-5 text-primary" />
          </div>
          <p className="text-2xl font-bold">{kpis.totalProducts}</p>
          <p className="text-xs text-on-surface-variant mt-1">Active SKUs</p>
        </div>

        <div className="col-span-12 md:col-span-3 bg-white border border-error/30 rounded p-4 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-error" />
          <div className="pl-2">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-semibold text-error uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" /> Critical Alerts
              </span>
            </div>
            <p className="text-2xl font-bold">{kpis.lowStockCount}</p>
            <p className="text-xs text-on-surface-variant mt-1">Items below minimum threshold</p>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 bg-white border border-outline rounded p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Revenue Trend (7 Days)</h3>
          </div>
          <div className="flex items-end justify-between h-48 px-2 border-b border-l border-outline">
            {revenueTrend.map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <div
                  className="w-full max-w-[32px] bg-primary/30 hover:bg-primary/50 transition-colors rounded-t relative group"
                  style={{ height: `${Math.max((Number(day.total) / maxRevenue) * 100, 4)}%` }}
                >
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-on-surface text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    ₱{Number(day.total).toLocaleString()}
                  </div>
                </div>
                <span className="text-xs text-on-surface-variant font-mono">{day.date}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 bg-white border border-outline rounded flex flex-col">
          <div className="p-4 border-b border-outline">
            <h3 className="font-semibold">Recent Transactions</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {recentTransactions.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center gap-3 p-2 hover:bg-surface-container-low rounded transition-colors">
                <div className="w-8 h-8 rounded-full bg-secondary-container/20 flex items-center justify-center shrink-0">
                  <DollarSign className="h-4 w-4 text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.buyerName}</p>
                  <p className="text-xs text-on-surface-variant">{t.transactionType.replace("Sale", "Sale ")} · ₱{Number(t.grandTotal || 0).toLocaleString()}</p>
                </div>
                <span className="text-xs text-on-surface-variant">{new Date(t.transactionDate).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            ))}
            {recentTransactions.length === 0 && (
              <p className="text-sm text-on-surface-variant text-center py-8">No transactions yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
