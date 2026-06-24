"use client";

import { useState, useEffect, useCallback } from "react";
import { getFinancialDashboard, getCashFlowTrend, getTopProductsByRevenue } from "@/actions";
import { PageHeader } from "@/components/ui/page-header";
import { ExportDialog } from "@/components/export-dialog";
import { TrendingUp, DollarSign, Receipt, ArrowUpRight, ArrowDownRight, ShoppingCart, RotateCcw, Undo2, Ban, BarChart3, PieChart, LineChart, ChevronLeft, ChevronRight, AlertTriangle, Package } from "lucide-react";
import { CardSkeleton } from "@/components/ui/skeleton";
import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Brush, ReferenceLine } from "recharts";

const PERIODS = [
  { label: "Last Year", value: "lastYear" },
  { label: "Last Quarter", value: "lastQuarter" },
  { label: "Last Month", value: "lastMonth" },
  { label: "Last Week", value: "lastWeek" },
  { label: "Today", value: "today" },
  { label: "This Week", value: "thisWeek" },
  { label: "This Month", value: "thisMonth" },
  { label: "This Quarter", value: "thisQuarter" },
  { label: "This Year", value: "thisYear" },
];

function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseLocalDate(dateStr: string, timeStr: string = "00:00:00"): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes, seconds] = timeStr.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, seconds || 0);
}

function formatMoney(value: number) {
  return value.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function periodDates(period: string, customStart?: string, customEnd?: string) {
  if (period === "custom" && customStart && customEnd) {
    return { start: customStart, end: customEnd };
  }
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const dow = now.getDay(); // 0=Sun

  const startOfWeek = new Date(y, m, d - dow);
  const endOfWeek = new Date(y, m, d - dow + 6);

  switch (period) {
    case "today":
      return { start: formatDate(now), end: formatDate(now) };
    case "lastYear":
      return { start: `${y - 1}-01-01`, end: `${y - 1}-12-31` };
    case "lastQuarter": {
      const q = Math.floor(m / 3) * 3;
      const prevQStart = new Date(y, q - 3, 1);
      const prevQEnd = new Date(y, q, 0);
      return { start: formatDate(prevQStart), end: formatDate(prevQEnd) };
    }
    case "lastMonth":
      return {
        start: formatDate(new Date(y, m - 1, 1)),
        end: formatDate(new Date(y, m, 0)),
      };
    case "lastWeek": {
      const lastSunday = new Date(y, m, d - dow);
      const lastMonday = new Date(y, m, d - dow - 6);
      return { start: formatDate(lastMonday), end: formatDate(lastSunday) };
    }
    case "thisWeek":
      return { start: formatDate(startOfWeek), end: formatDate(endOfWeek) };
    case "thisMonth":
      return { start: formatDate(new Date(y, m, 1)), end: formatDate(now) };
    case "thisQuarter": {
      const q = Math.floor(m / 3) * 3;
      return { start: formatDate(new Date(y, q, 1)), end: formatDate(now) };
    }
    case "thisYear":
      return { start: `${y}-01-01`, end: formatDate(now) };
    default:
      return { start: formatDate(new Date(y, m, 1)), end: formatDate(now) };
  }
}

export default function FinancePage() {
  const [period, setPeriod] = useState("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [fin, setFin] = useState<any>(null);
  const [cashFlow, setCashFlow] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [topPage, setTopPage] = useState(1);
  const topPerPage = 5;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const dates = period === "custom"
        ? { start: customStart, end: customEnd }
        : periodDates(period);
      const startDate = dates ? parseLocalDate(dates.start) : undefined;
      const endDate = dates ? parseLocalDate(dates.end, "23:59:59") : undefined;

      // Determine grouping based on period or custom range
      let groupBy: "hourly" | "daily" | "weekly" | "monthly" = "daily";
      if (period === "today") {
        groupBy = "hourly";
      } else if (period === "thisYear" || period === "lastYear") {
        groupBy = "monthly";
      } else if (period === "thisQuarter" || period === "lastQuarter") {
        groupBy = "weekly";
      } else if (period === "custom" && startDate && endDate) {
        const diffDays = Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1;
        if (diffDays <= 14) groupBy = "daily";
        else if (diffDays <= 90) groupBy = "weekly";
        else groupBy = "monthly";
      }

      const [finance, flow, products] = await Promise.all([
        getFinancialDashboard(dates),
        getCashFlowTrend(30, startDate, endDate, period === "today", groupBy),
        getTopProductsByRevenue(30, 50, startDate, endDate),
      ]);
      setFin(finance);
      setCashFlow(flow);
      setTopProducts(products);
      setTopPage(1);
    } finally {
      setLoading(false);
    }
  }, [period, customStart, customEnd]);

  useEffect(() => { load(); }, [load]);


  const topTotalPages = Math.ceil(topProducts.length / topPerPage);
  const topPaginated = topProducts.slice((topPage - 1) * topPerPage, topPage * topPerPage);
  const cashFlowTimeline = cashFlow.map((d) => ({
    label: d.date,
    revenue: d.revenue,
    expenses: d.expenses,
    net: d.net,
  }));

  function handlePeriodClick(value: string) {
    if (value === "custom") {
      setShowCustom(true);
      return;
    }
    setShowCustom(false);
    setPeriod(value);
  }

  function applyCustom() {
    if (customStart && customEnd) {
      setPeriod("custom");
      setShowCustom(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <PageHeader title="Financial Dashboard" subtitle="Revenue, expenses, profit & cash flow analysis" />
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-[#e2e8f0] rounded-xl p-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {PERIODS.map((p) => (
            <button key={p.value} onClick={() => handlePeriodClick(p.value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${period === p.value ? "bg-[#fd761a] text-white shadow-sm" : "text-[#64748b] hover:text-[#0e212c]"}`}>
              {p.label}
            </button>
          ))}
          <button onClick={() => handlePeriodClick("custom")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${period === "custom" ? "bg-[#fd761a] text-white shadow-sm" : "text-[#64748b] hover:text-[#0e212c]"}`}>
            Custom
          </button>
        </div>
        <div className="flex items-center gap-2">
          {showCustom && (
            <div className="flex items-center gap-2">
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)}
                className="h-8 px-2 border border-[#e2e8f0] rounded text-xs" />
              <span className="text-xs text-[#94a3b8]">-</span>
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)}
                className="h-8 px-2 border border-[#e2e8f0] rounded text-xs" />
              <button onClick={applyCustom}
                className="h-8 px-3 bg-[#fd761a] text-white text-xs font-semibold rounded hover:brightness-110 transition-all">
                Apply
              </button>
            </div>
          )}
          <ExportDialog
            filename={`cwl-hardware-finance${period !== "thisMonth" ? `-${period === "custom" ? `${customStart}_${customEnd}` : period}` : ""}-${new Date().toISOString().slice(0, 10)}.csv`}
            allColumns={[
              { key: "section", label: "Section" },
              { key: "label", label: "Label" },
              { key: "amount", label: "Amount" },
              { key: "revenue", label: "Revenue" },
              { key: "expenses", label: "Expenses" },
              { key: "net", label: "Net" },
            ]}
            fetchRows={async (selectedColumns) => {
              if (!fin) return [];
              const rows: string[][] = [
                ["Summary", "Period", fin.period?.label || "", "", "", ""],
                ["Summary", "Gross Sales", formatMoney(fin.grossSales), "", "", ""],
                ["Summary", "Returns", formatMoney(fin.returnsTotal), "", "", ""],
                ["Summary", "Gross Revenue", formatMoney(fin.grossRevenue), "", "", ""],
                ["Summary", "Restocks Cost", formatMoney(fin.restocksTotal), "", "", ""],
                ["Summary", "Damages Loss", formatMoney(fin.damagesTotal), "", "", ""],
                ["Summary", "Net Revenue", formatMoney(fin.netRevenue), "", "", ""],
                ["Summary", "Sales Transactions", String(fin.salesCount), "", "", ""],
                ["Summary", "Returns Count", String(fin.returnCount), "", "", ""],
                ["Summary", "Restocks Count", String(fin.restockCount), "", "", ""],
                ["Summary", "Damages Count", String(fin.damageCount), "", "", ""],
                ["Summary", "Adjustments Count", String(fin.adjustmentCount), "", "", ""],
                ["Summary", "Cancelled Count", String(fin.cancelledCount), "", "", ""],
                ["Cash Flow Timeline", "", "", "", "", ""],
              ];
              if (fin.paymentBreakdown?.length > 0) {
                rows.push(["Payment Breakdown", "", "", "", "", ""]);
                for (const pm of fin.paymentBreakdown) {
                  rows.push([
                    "Payment Breakdown",
                    pm.method,
                    `${formatMoney(pm.total)} (${pm.count} txn)`,
                    "",
                    "",
                    "",
                  ]);
                }
              }
              for (const entry of cashFlowTimeline) {
                rows.push([
                  "Cash Flow Timeline",
                  entry.label,
                  "",
                  formatMoney(entry.revenue),
                  formatMoney(entry.expenses),
                  formatMoney(entry.net),
                ]);
              }
              return rows.map((row) =>
                selectedColumns.map((key) => {
                  if (key === "section") return row[0];
                  if (key === "label") return row[1];
                  if (key === "amount") return row[2] ?? "";
                  if (key === "revenue") return row[3] ?? "";
                  if (key === "expenses") return row[4] ?? "";
                  if (key === "net") return row[5] ?? "";
                  return "";
                }),
              );
            }}
            label="Export Report"
            title="Export financial report"
            filterLabel={period === "custom" ? `${customStart} to ${customEnd}` : PERIODS.find((p) => p.value === period)?.label || period}
          />
        </div>
      </div>

      {loading ? (
        <CardSkeleton count={5} />
      ) : fin ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-12 gap-4">
            {[
              { icon: TrendingUp, label: "Gross Sales", value: `${fin.grossSales.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, change: fin.comparison.grossChange, color: "from-emerald-500 to-teal-600", bg: "bg-emerald-50" },
              { icon: DollarSign, label: "Gross Revenue", value: `${fin.grossRevenue.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, change: fin.comparison.netChange, color: "from-blue-500 to-indigo-600", bg: "bg-blue-50" },
              { icon: ShoppingCart, label: "Restocks Cost", value: `${fin.restocksTotal.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: "from-rose-500 to-pink-600", bg: "bg-rose-50" },
              { icon: Undo2, label: "Returns Loss", value: `${fin.returnsTotal.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: "from-amber-500 to-yellow-600", bg: "bg-amber-50" },
              { icon: AlertTriangle, label: "Damages Loss", value: `${fin.damagesTotal.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: "from-orange-500 to-red-600", bg: "bg-orange-50" },
              { icon: TrendingUp, label: "Net Revenue", value: `${fin.netRevenue.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, profit: fin.netRevenue >= 0, color: "from-violet-500 to-purple-600", bg: "bg-violet-50" },
            ].map((card, i) => (
              <div key={i} className="col-span-12 sm:col-span-6 lg:col-span-2 bg-white/90 backdrop-blur-sm rounded-xl border border-[#e2e8f0] p-5 hover:shadow-lg hover:shadow-black/5 hover:bg-white transition-all duration-300 hover:-translate-y-0.5 group">
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
              { icon: AlertTriangle, label: "Damages", value: fin.damageCount, color: "bg-rose-50 text-rose-600" },
              { icon: Package, label: "Adjustments", value: fin.adjustmentCount, color: "bg-violet-50 text-violet-600" },
              { icon: Ban, label: "Cancelled", value: fin.cancelledCount, color: "bg-rose-50 text-rose-600" },
            ].map((card, i) => (
              <div key={i} className="col-span-6 sm:col-span-3 lg:col-span-3 bg-white rounded-xl border border-[#e2e8f0] p-4 flex items-center gap-4 hover:shadow-md transition-all">
                <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center shrink-0`}><card.icon className="h-4 w-4" /></div>
                <div><p className="text-xs text-[#64748b]">{card.label}</p><p className="text-lg font-bold text-[#0e212c]">{card.value}</p></div>
              </div>
            ))}
          </div>

          {/* Top Products & Payment Methods */}
          <div className="grid grid-cols-12 gap-5">
            <div className="col-span-12 sm:col-span-6 bg-white rounded-xl border border-[#e2e8f0] p-6">
              <h3 className="text-sm font-bold text-[#0e212c] mb-4 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-[#fd761a]" /> Top Products by Revenue ({fin.period.label})</h3>
              {topProducts.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider border-b border-[#e2e8f0]"><th className="text-left pb-3 font-semibold">Product</th><th className="text-right pb-3 font-semibold">Qty Sold</th><th className="text-right pb-3 font-semibold">Revenue</th><th className="w-1/2 pb-3"></th></tr></thead>
                      <tbody className="divide-y divide-[#e2e8f0]">
                        {topPaginated.map((p: any, i: number) => {
                          const maxRev = topProducts[0]?.revenue || 1;
                          const barW = (p.revenue / maxRev) * 100;
                          return (
                            <tr key={i} className="hover:bg-[#f8fafc] transition-colors">
                              <td className="py-3 font-medium text-[#0e212c]">{p.name}</td>
                              <td className="py-3 text-right text-[#64748b]">{p.quantity}</td>
                              <td className="py-3 text-right font-mono font-semibold text-[#0e212c]">{p.revenue.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              <td className="py-3 pl-4"><div className="h-2.5 bg-[#f1f5f9] rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#fd761a] to-[#e56600] rounded-full" style={{ width: `${barW}%` }} /></div></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {topTotalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t border-[#e2e8f0] mt-4">
                      <span className="text-xs text-[#94a3b8]">{topProducts.length} total products</span>
                      <div className="flex items-center gap-1">
                        <button disabled={topPage === 1} onClick={() => setTopPage((p) => Math.max(1, p - 1))}
                          className="p-1.5 rounded-md text-[#64748b] hover:bg-[#f1f5f9] disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        {Array.from({ length: topTotalPages }, (_, i) => i + 1).map((pg) => (
                          <button key={pg} onClick={() => setTopPage(pg)}
                            className={`min-w-[28px] h-7 text-xs font-semibold rounded-md transition-all ${pg === topPage ? "bg-[#fd761a] text-white shadow-sm" : "text-[#64748b] hover:bg-[#f1f5f9]"}`}>
                            {pg}
                          </button>
                        ))}
                        <button disabled={topPage === topTotalPages} onClick={() => setTopPage((p) => Math.min(topTotalPages, p + 1))}
                          className="p-1.5 rounded-md text-[#64748b] hover:bg-[#f1f5f9] disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : <p className="text-sm text-[#94a3b8] text-center py-8">No product sales data for this period</p>}
            </div>

            <div className="col-span-12 sm:col-span-6 bg-white rounded-xl border border-[#e2e8f0] p-6">
              <h3 className="text-sm font-bold text-[#0e212c] mb-4 flex items-center gap-2"><PieChart className="h-4 w-4 text-[#fd761a]" /> Payment Methods</h3>
              {fin.paymentBreakdown.length > 0 ? (
                <div className="space-y-3">
                  {fin.paymentBreakdown.map((pm: any, i: number) => {
                    const pct = fin.grossRevenue > 0 ? ((pm.total / fin.grossRevenue) * 100).toFixed(1) : 0;
                    return (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1"><span className="font-medium text-[#0e212c]">{pm.method}</span><span className="font-mono text-[#64748b]">{pm.total.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({pct}%)</span></div>
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
          {/* Cash Flow Trend */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#0e212c] flex items-center gap-2"><LineChart className="h-4 w-4 text-[#fd761a]" /> Cash Flow Timeline ({fin.period.label})</h3>
            </div>
            <div className="mt-2">
              {cashFlowTimeline.length > 0 ? (
                <div className="h-[360px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={cashFlowTimeline} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: "#64748b", fontSize: 10 }}
                        tickLine={false}
                        axisLine={{ stroke: "#e2e8f0" }}
                        minTickGap={18}
                      />
                      <YAxis
                        tick={{ fill: "#64748b", fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => formatMoney(Number(value))}
                      />
                      <Tooltip
                        formatter={(value: any, name: any): [string, string] => [formatMoney(Number(value ?? 0)), String(name ?? "")]}
                        labelStyle={{ color: "#0e212c", fontWeight: 700 }}
                        contentStyle={{
                          borderRadius: 10,
                          borderColor: "#e2e8f0",
                          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
                        }}
                      />
                      <ReferenceLine y={0} stroke="#cbd5e1" strokeDasharray="4 4" />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.12}
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="expenses"
                        name="Expenses"
                        stroke="#ef4444"
                        fill="#ef4444"
                        fillOpacity={0.1}
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="net"
                        name="Net"
                        stroke="#fd761a"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                      {cashFlowTimeline.length > 12 && (
                        <Brush dataKey="label" height={24} travellerWidth={8} stroke="#fd761a" />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-[#94a3b8] text-center py-12">No cash flow data for this period</p>
              )}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-[#f1f5f9] text-[10px] font-semibold text-[#64748b] uppercase tracking-wider">
              <span className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-emerald-50 transition-colors"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400/50 shadow-sm" /> Revenue</span>
              <span className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-rose-50 transition-colors"><span className="w-2.5 h-2.5 rounded-full bg-rose-400/50 shadow-sm" /> Expenses</span>
              <span className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-emerald-50 transition-colors"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70 shadow-sm" /> Net Profit</span>
            </div>
          </div>

          <p className="text-[10px] text-[#94a3b8] text-center font-medium opacity-70 tracking-widest uppercase">{fin.period.label}</p>
        </>
      ) : <p className="text-sm text-[#94a3b8] text-center py-12">No financial data available</p>}
    </div>
  );
}



