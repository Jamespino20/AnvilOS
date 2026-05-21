/*
App Name: AnvilOS
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: 
*/

"use client";

import { useState, useEffect } from "react";
import { getTransactions, updateTransactionStatus, getProducts } from "@/actions";
import { Search, Receipt, Filter, Loader2, CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/skeleton";
import type { Transaction, TransactionItem, Product } from "@prisma/client";

type TxnWithItems = Transaction & { items: TransactionItem[] };

const STATUS_OPTIONS = ["", "Completed", "Ongoing", "Cancelled"];
const TYPE_OPTIONS = ["", "SaleWalkIn", "SalePO", "Return", "Restock", "Damage", "Adjustment"];

function statusBadge(status: string) {
  const map: Record<string, string> = {
    Completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    Ongoing: "bg-amber-50 text-amber-700 border border-amber-200",
    Cancelled: "bg-rose-50 text-rose-700 border border-rose-200",
  };
  return map[status] || "bg-[#f8fafc] text-[#64748b] border border-[#e2e8f0]";
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TxnWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 15;

  useEffect(() => {
    Promise.all([
      getTransactions({ status: statusFilter || undefined, type: typeFilter || undefined, search: search || undefined }),
      getProducts({}),
    ]).then(([data, prods]) => {
      setTransactions(data as TxnWithItems[]);
      setProducts(prods as Product[]);
      setLoading(false);
    });
  }, [statusFilter, typeFilter, search]);

  async function quickStatusChange(id: number, status: "Completed" | "Cancelled") {
    await updateTransactionStatus(id, status);
    const data = await getTransactions({ status: statusFilter || undefined, type: typeFilter || undefined, search: search || undefined });
    setTransactions(data as TxnWithItems[]);
  }

  const totalPages = Math.ceil(transactions.length / perPage);
  const paged = transactions.slice((page - 1) * perPage, page * perPage);

  if (loading) return <div className="space-y-5"><PageHeader title="Transactions" subtitle="Loading..." /><TableSkeleton rows={10} cols={7} /></div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader title="Transactions" subtitle="View and manage all sales, returns, restocks, and adjustments. Filter by status or type to find specific records." />
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search buyer or receipt..." className="w-56 pl-9 pr-3 py-2 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a]" />
          </div>
          <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a]">
            <option value="">All Types</option>
            {TYPE_OPTIONS.slice(1).map((t) => <option key={t} value={t}>{t.replace(/([A-Z])/g, " $1").trim()}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a]">
            <option value="">All Status</option>
            {STATUS_OPTIONS.slice(1).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                <th className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Receipt #</th>
                <th className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Buyer</th>
                <th className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Type</th>
                <th className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Date</th>
                <th className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Payment</th>
                <th className="text-right p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Total</th>
                <th className="text-center p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Status</th>
                <th className="text-center p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {paged.map((t, i) => (
                <>
                  <tr key={t.id} className={`${i % 2 === 0 ? "" : "bg-[#fafbfc]"} hover:bg-[#f1f5f9] transition-colors cursor-pointer`}
                    onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}>
                    <td className="p-4 font-mono text-sm text-[#0e212c]">#{t.receiptNumber}</td>
                    <td className="p-4 font-medium text-[#0e212c]">{t.buyerName}</td>
                    <td className="p-4 text-[#64748b]">{t.transactionType.replace(/([A-Z])/g, " $1").trim()}</td>
                    <td className="p-4 text-[#64748b]">{new Date(t.transactionDate).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</td>
                    <td className="p-4 text-[#64748b]">{t.paymentMethod || "—"}</td>
                    <td className="p-4 text-right font-mono text-[#0e212c] font-semibold">₱{Number(t.grandTotal || 0).toLocaleString()}</td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${statusBadge(t.transactionStatus)}`}>
                        {t.transactionStatus}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {t.transactionStatus === "Ongoing" && (
                          <>
                            <button onClick={(e) => { e.stopPropagation(); quickStatusChange(t.id, "Completed"); }} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-all" title="Complete"><CheckCircle className="h-3.5 w-3.5" /></button>
                            <button onClick={(e) => { e.stopPropagation(); quickStatusChange(t.id, "Cancelled"); }} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition-all" title="Cancel"><XCircle className="h-3.5 w-3.5" /></button>
                          </>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); setExpandedId(expandedId === t.id ? null : t.id); }} className="p-1.5 text-[#94a3b8] hover:bg-[#f1f5f9] rounded-md transition-all">
                          {expandedId === t.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === t.id && (
                    <tr key={`${t.id}-items`}>
                      <td colSpan={8} className="bg-[#f8fafc] p-4">
                        <div className="max-w-xl">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">
                                <th className="text-left pb-2">Product</th>
                                <th className="text-right pb-2">Qty</th>
                                <th className="text-right pb-2">Price</th>
                                <th className="text-right pb-2">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e2e8f0]">
                              {t.items.map((item) => (
                                <tr key={item.id}>
                                  <td className="py-1.5 text-[#0e212c] font-medium">{products.find(p => p.id === item.productId)?.productName || `#${item.productId}`}</td>
                                  <td className="py-1.5 text-right text-[#64748b]">{item.quantity}</td>
                                  <td className="py-1.5 text-right font-mono text-[#64748b]">₱{Number(item.unitPrice).toLocaleString()}</td>
                                  <td className="py-1.5 text-right font-mono text-[#0e212c] font-semibold">₱{Number(item.totalPrice).toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="flex gap-4 mt-3 text-xs text-[#94a3b8]">
                            <span>Delivery: {t.deliveryMethod}</span>
                            <span>Payment: {t.paymentMethod || "—"}</span>
                            {t.returnForReceiptNumber && <span>Return of: #{t.returnForReceiptNumber}</span>}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {transactions.length === 0 && (
                <tr><td colSpan={8} className="p-8 text-center text-[#94a3b8]">No transactions found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1.5 border border-[#e2e8f0] rounded-lg text-[#64748b] hover:bg-white disabled:opacity-50 transition-all">Prev</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${p === page ? "bg-[#fd761a] text-white" : "text-[#64748b] hover:bg-[#f1f5f9]"}`}>{p}</button>
          ))}
          <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-3 py-1.5 border border-[#e2e8f0] rounded-lg text-[#64748b] hover:bg-white disabled:opacity-50 transition-all">Next</button>
        </div>
      )}
    </div>
  );
}
