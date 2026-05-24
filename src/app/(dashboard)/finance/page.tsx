"use client";

import { useState, useEffect, useCallback } from "react";
import { getFinancialDashboard, getCashFlowTrend, getTopProductsByRevenue } from "@/actions";
import { PageHeader } from "@/components/ui/page-header";
import { ExportDialog } from "@/components/export-dialog";
import { TrendingUp, TrendingDown, DollarSign, Receipt, ArrowUpRight, ArrowDownRight, Calendar, ShoppingCart, RotateCcw, Ban, Wallet, BarChart3, PieChart, LineChart, Download } from "lucide-react";

const PERIODS = [
  { label: "This Month", value: "month" },
  { label: "Last Month", value: "lastMonth" },
  { label: "This Quarter", value: "quarter" },
  { label: "This Year", value: "year" },
  { label: "7 Days", value: "7d" },
  { label: "30 Days", value: "30d" },
  { label: "90 Days", value: "90d" },
];

function periodDates(period: string) {
  const now = new Date();
  switch (period) {
    case "month": return { start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0], end: now.toISOString().split("T")[0] };
    case "lastMonth": return { start: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0], end: new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split("T")[0] };
    case "quarter": { const q = Math.floor(now.getMonth() / 3) * 3; return { start: new Date(now.getFullYear(), q, 1).toISOString().split("T")[0], end: now.toISOString().split("T")[0] }; }
    case "year": return { start: new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0], end: now.toISOString().split("T")[0] };
    case "7d": { const d = new Date(); d.setDate(d.getDate() - 7); return { start: d.toISOString().split("T")[0], end: now.toISOString().split("T")[0] }; }
    case "30d": { const d = new Date(); d.setDate(d.getDate() - 30); return { start: d.toISOString().split("T")[0], end: now.toISOString().split("T")[0] }; }
    case "90d": { const d = new Date(); d.setDate(d.getDate() - 90); return { start: d.toISOString().split("T")[0], end: now.toISOString().split("T")[0] }; }
    default: return { start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0], end: now.toISOString().split("T")[0] };
  }
}

export default function FinancePage() {
  const [period, setPeriod] = useState("month");
  const [fin, setFin] = useState<any>(null);
  const [cashFlow, setCashFlow] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const dates = periodDates(period);
      const [finance, flow, products] = await Promise.all([
        getFinancialDashboard(dates),
        getCashFlowTrend(30),
        getTopProductsByRevenue(30, 10),
      ]);
      setFin(finance);
      setCashFlow(flow);
      setTopProducts(products);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const maxFlow = Math.max(...cashFlow.map((d) => Math.max(d.revenue, d.expenses, Math.abs(d.net))), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader title="Financial Dashboard" subtitle="Revenue, expenses, profit & cash flow analysis" />
        <div className="flex items-center gap-2 flex-wrap">
          <ExportDialog
            filename={`cwl-hardware-finance-${new Date().toISOString().slice(0, 10)}.csv`}
            allColumns={[
              { key: "metric", label: "Metric" },
              { key: "value", label: "Value" },
            ]}
            fetchRows={async (selectedColumns) => {
              if (!fin) return [];
              const rows: string[][] = [
                ["Period", fin.period?.label || ""],
                ["Gross Revenue", `₱${fin.grossRevenue.toLocaleString()}`],
                ["Net Revenue", `₱${fin.netRevenue.toLocaleString()}`],
                ["Restocks Total", `₱${fin.restocksTotal.toLocaleString()}`],
                ["Profit / Loss", `₱${fin.profitLoss.toLocaleString()}`],
                ["Sales Transactions", String(fin.salesCount)],
                ["Returns", String(fin.returnCount)],
                ["Restocks", String(fin.restockCount)],
                ["Cancelled", String(fin.cancelledCount)],
              ];
              if (fin.paymentBreakdown?.length > 0) {
                rows.push([]);
                rows.push(["Payment Method Breakdown"]);
                for (const pm of fin.paymentBreakdown) {
                  rows.push([pm.method, `₱${pm.total.toLocaleString()} (${pm.count} txn)`]);
                }
              }
              return rows.map((r) => selectedColumns.map((key) => {
                if (key === "metric") return r[0];
                if (key === "value") return r[1] ?? "";
                return "";
              }));
            }}
            label="Export Report"
            title="Export financial report"
          />
        </div>
        <div className="flex items-center gap-2 bg-white border border-[#e2e8f0] rounded-lg p-1">
          {PERIODS.map((p) => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${period === p.value ? "bg-[#fd761a] text-white shadow-sm" : "text-[#64748b] hover:text-[#0e212c]"}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-12 gap-5">
          {[1, 2, 3, 4].map((i) => <div key={i} className="col-span-12 sm:col-span-6 lg:col-span-3 bg-white rounded-xl border border-[#e2e8f0] p-5 animate-pulse"><div className="h-4 w-24 bg-[#f1f5f9] rounded mb-3" /><div className="h-8 w-32 bg-[#f1f5f9] rounded" /></div>)}
        </div>
      ) : fin ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-12 gap-4">
            {[
              { icon: TrendingUp, label: "Gross Revenue", value: `₱${fin.grossRevenue.toLocaleString()}`, change: fin.comparison.grossChange, color: "from-emerald-500 to-teal-600", bg: "bg-emerald-50" },
              { icon: DollarSign, label: "Net Revenue", value: `₱${fin.netRevenue.toLocaleString()}`, change: fin.comparison.netChange, color: "from-blue-500 to-indigo-600", bg: "bg-blue-50" },
              { icon: ShoppingCart, label: "Expenses (Restocks)", value: `₱${fin.restocksTotal.toLocaleString()}`, color: "from-rose-500 to-pink-600", bg: "bg-rose-50" },
              { icon: Wallet, label: "Profit / Loss", value: `₱${fin.profitLoss.toLocaleString()}`, profit: fin.profitLoss >= 0, color: "from-violet-500 to-purple-600", bg: "bg-violet-50" },
            ].map((card, i) => (
              <div key={i} className="col-span-12 sm:col-span-6 lg:col-span-3 bg-white/90 backdrop-blur-sm rounded-xl border border-[#e2e8f0] p-5 hover:shadow-lg hover:shadow-black/5 hover:bg-white transition-all duration-300 hover:-translate-y-0.5 group">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider group-hover:text-[#fd761a] transition-colors">{card.label}</span>
                  <div className={`w-9 h-9 rounded-lg ${card.bg} group-hover:scale-110 transition-transform duration-300 flex items-center justify-center`}><card.icon className="h-4 w-4 text-[#0e212c]" /></div>
                </div>
                <p className={`text-2xl font-bold tracking-tight ${card.profit !== undefined ? (card.profit ? "text-emerald-600" : "text-rose-600") : "text-[#0e212c]"}`}>{card.value}</p>
                <p className="text-xs text-[#94a3b8] mt-1.5 flex items-center gap-1">
                  {card.change !== null && card.change !== undefined ? (
                    <span className={`flex items-center gap-0.5 font-semibold ${card.change >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                      {card.change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {Math.abs(card.change)}% vs previous period
                    </span>
                  ) : <span className="text-[#94a3b8]">No prior data</span>}
                </p>
              </div>
            ))}
          </div>

          {/* Secondary KPI row */}
          <div className="grid grid-cols-12 gap-4">
            {[
              { icon: Receipt, label: "Sales Transactions", value: fin.salesCount, color: "bg-emerald-50 text-emerald-600" },
              { icon: RotateCcw, label: "Returns", value: fin.returnCount, color: "bg-amber-50 text-amber-600" },
              { icon: ShoppingCart, label: "Restocks", value: fin.restockCount, color: "bg-blue-50 text-blue-600" },
              { icon: Ban, label: "Cancelled", value: fin.cancelledCount, color: "bg-rose-50 text-rose-600" },
            ].map((card, i) => (
              <div key={i} className="col-span-6 sm:col-span-3 lg:col-span-3 bg-white rounded-xl border border-[#e2e8f0] p-4 flex items-center gap-4 hover:shadow-md transition-all">
                <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center shrink-0`}><card.icon className="h-4 w-4" /></div>
                <div><p className="text-xs text-[#64748b]">{card.label}</p><p className="text-lg font-bold text-[#0e212c]">{card.value}</p></div>
              </div>
            ))}
          </div>

          {/* Cash Flow Trend & Payment Breakdown */}
          <div className="grid grid-cols-12 gap-5">
            {/* Cash Flow Bar Chart */}
            <div className="col-span-12 lg:col-span-8 bg-white rounded-xl border border-[#e2e8f0] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#0e212c] flex items-center gap-2"><LineChart className="h-4 w-4 text-[#fd761a]" /> Cash Flow (30 Days)</h3>
              </div>
              <div className="h-64 flex items-end gap-[3px]">
                {cashFlow.map((d, i) => {
                  const revH = maxFlow > 0 ? (d.revenue / maxFlow) * 200 : 0;
                  const expH = maxFlow > 0 ? (d.expenses / maxFlow) * 200 : 0;
                  const netH = maxFlow > 0 ? (Math.abs(d.net) / maxFlow) * 200 : 0;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-[2px] group relative">
                      <div className="w-full flex flex-col items-center gap-[2px] justify-end" style={{ height: "200px" }}>
                        <div className="w-full bg-emerald-400/40 rounded-t-sm transition-all group-hover:bg-emerald-400/60" style={{ height: `${revH}px` }} title={`${d.date}: Revenue ₱${d.revenue.toLocaleString()}`} />
                        <div className="w-full bg-rose-400/40 rounded-t-sm transition-all group-hover:bg-rose-400/60" style={{ height: `${expH}px` }} title={`${d.date}: Expenses ₱${d.expenses.toLocaleString()}`} />
                        <div className={`w-full ${d.net >= 0 ? "bg-emerald-500/60" : "bg-rose-500/60"} rounded-t-sm transition-all group-hover:opacity-80`} style={{ height: `${netH}px` }} title={`${d.date}: Net ₱${d.net.toLocaleString()}`} />
                      </div>
                      <span className="text-[8px] text-[#94a3b8] rotate-45 origin-left whitespace-nowrap mt-1">{d.date.split(" ")[0]}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-4 text-xs text-[#64748b]">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-400/40" /> Revenue</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-rose-400/40" /> Expenses</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500/60" /> Net Profit</span>
              </div>
            </div>

            {/* Payment Method Breakdown */}
            <div className="col-span-12 sm:col-span-6 lg:col-span-4 bg-white rounded-xl border border-[#e2e8f0] p-6">
              <h3 className="text-sm font-bold text-[#0e212c] mb-4 flex items-center gap-2"><PieChart className="h-4 w-4 text-[#fd761a]" /> Payment Methods</h3>
              {fin.paymentBreakdown.length > 0 ? (
                <div className="space-y-3">
                  {fin.paymentBreakdown.map((pm: any, i: number) => {
                    const pct = fin.grossRevenue > 0 ? ((pm.total / fin.grossRevenue) * 100).toFixed(1) : 0;
                    return (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1"><span className="font-medium text-[#0e212c]">{pm.method}</span><span className="font-mono text-[#64748b]">₱{pm.total.toLocaleString()} ({pct}%)</span></div>
                        <div className="w-full h-2 bg-[#f1f5f9] rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#fd761a] to-[#e56600] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-[10px] text-[#94a3b8] mt-0.5">{pm.count} transaction{pm.count !== 1 ? "s" : ""}</p>
                      </div>
                    );
                  })}
                </div>
              ) : <p className="text-sm text-[#94a3b8] text-center py-8">No payment data for this period</p>}
            </div>
          </div>

          {/* Top Products by Revenue */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-6">
            <h3 className="text-sm font-bold text-[#0e212c] mb-4 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-[#fd761a]" /> Top Products by Revenue (30 Days)</h3>
            {topProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider border-b border-[#e2e8f0]"><th className="text-left pb-3 font-semibold">Product</th><th className="text-right pb-3 font-semibold">Qty Sold</th><th className="text-right pb-3 font-semibold">Revenue</th><th className="w-1/2 pb-3"></th></tr></thead>
                  <tbody className="divide-y divide-[#e2e8f0]">
                    {topProducts.map((p: any, i: number) => {
                      const maxRev = topProducts[0]?.revenue || 1;
                      const barW = (p.revenue / maxRev) * 100;
                      return (
                        <tr key={i} className="hover:bg-[#f8fafc] transition-colors">
                          <td className="py-3 font-medium text-[#0e212c]">{p.name}</td>
                          <td className="py-3 text-right text-[#64748b]">{p.quantity}</td>
                          <td className="py-3 text-right font-mono font-semibold text-[#0e212c]">₱{p.revenue.toLocaleString()}</td>
                          <td className="py-3 pl-4"><div className="h-2.5 bg-[#f1f5f9] rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#fd761a] to-[#e56600] rounded-full" style={{ width: `${barW}%` }} /></div></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-sm text-[#94a3b8] text-center py-8">No product sales data for this period</p>}
          </div>

          {/* Period info */}
          <p className="text-xs text-[#94a3b8] text-center">{fin.period.label}</p>
        </>
      ) : <p className="text-sm text-[#94a3b8] text-center py-12">No financial data available</p>}
    </div>
  );
}
