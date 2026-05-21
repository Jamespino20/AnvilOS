"use client";

import { useState, useEffect } from "react";
import { getTransactions } from "@/actions";
import { Search, ArrowDownUp, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import type { Transaction, TransactionItem } from "@prisma/client";

type TxnWithItems = Transaction & { items: TransactionItem[] };

export default function RestocksPage() {
  const [restocks, setRestocks] = useState<TxnWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    getTransactions({ type: "Restock" }).then((data) => setRestocks(data as TxnWithItems[])).finally(() => setLoading(false));
  }, []);

  const filtered = restocks.filter(
    (r) =>
      r.buyerName.toLowerCase().includes(search.toLowerCase()) ||
      String(r.receiptNumber).includes(search)
  );

  if (loading) return <div className="flex items-center justify-center h-64 text-[#64748b]"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0e212c] tracking-tight">Restocks</h1>
          <p className="text-sm text-[#64748b] mt-1">{restocks.length} restock record{restocks.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search restocks..." className="w-full pl-9 pr-3 py-2 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a]" />
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((r) => {
          const isExpanded = expandedId === r.id;
          return (
            <div key={r.id} className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4 flex items-center gap-4">
                <div className="w-11 h-11 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <ArrowDownUp className="h-5 w-5" />
                </div>
                <div className="flex-1 grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-[10px] font-semibold text-[#94a3b8] uppercase">Receipt</p>
                    <p className="font-mono text-[#0e212c] font-medium mt-0.5">#{r.receiptNumber}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-[#94a3b8] uppercase">Supplier</p>
                    <p className="text-[#0e212c] font-medium mt-0.5 truncate">{r.buyerName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-[#94a3b8] uppercase">Items</p>
                    <p className="text-[#0e212c] mt-0.5">{r.items.length} item{r.items.length !== 1 ? "s" : ""}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-[#94a3b8] uppercase">Date</p>
                    <p className="text-[#64748b] mt-0.5">{new Date(r.transactionDate).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</p>
                  </div>
                </div>
                <button onClick={() => setExpandedId(isExpanded ? null : r.id)} className="p-1.5 text-[#94a3b8] hover:bg-[#f1f5f9] rounded-lg transition-all">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>
              {isExpanded && (
                <div className="border-t border-[#e2e8f0] bg-[#f8fafc] p-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">
                        <th className="text-left pb-2">Product</th>
                        <th className="text-right pb-2">Qty</th>
                        <th className="text-right pb-2">Unit Price</th>
                        <th className="text-right pb-2">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e2e8f0]">
                      {r.items.map((item) => (
                        <tr key={item.id}>
                          <td className="py-2 text-[#0e212c] font-medium">#{item.productId}</td>
                          <td className="py-2 text-right text-[#64748b]">{item.quantity}</td>
                          <td className="py-2 text-right font-mono text-[#64748b]">₱{Number(item.unitPrice).toLocaleString()}</td>
                          <td className="py-2 text-right font-mono text-[#0e212c] font-semibold">₱{Number(item.totalPrice).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-[#94a3b8]">
            <ArrowDownUp className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No restocks recorded</p>
            <p className="text-xs mt-1">Restock entries will appear here after processing</p>
          </div>
        )}
      </div>
    </div>
  );
}
