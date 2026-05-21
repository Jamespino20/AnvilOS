"use client";

import { useState, useEffect } from "react";
import { getTransactions, getProducts, processRestock, createTransaction } from "@/actions";
import { Search, ArrowDownUp, Loader2, ChevronDown, ChevronUp, CheckCircle, Plus, X, Minus, Package } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { CardSkeleton } from "@/components/ui/skeleton";
import type { Transaction, TransactionItem, Product } from "@prisma/client";

type TxnWithItems = Transaction & { items: TransactionItem[] };

export default function RestocksPage() {
  const [restocks, setRestocks] = useState<TxnWithItems[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [supplierName, setSupplierName] = useState("");
  const [restockItems, setRestockItems] = useState<{ productId: number; quantity: number }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    Promise.all([
      getTransactions({ type: "Restock" }),
      getProducts({}),
    ]).then(([data, prods]) => {
      setRestocks(data as TxnWithItems[]);
      setProducts(prods as Product[]);
      setLoading(false);
    });
  }

  useEffect(load, []);

  const filtered = restocks.filter(
    (r) =>
      r.buyerName.toLowerCase().includes(search.toLowerCase()) ||
      String(r.receiptNumber).includes(search)
  );

  async function handleProcess(id: number) {
    setProcessingId(id);
    try {
      await processRestock(id);
      load();
    } catch (e) {
      console.error("Failed to process restock", e);
    } finally {
      setProcessingId(null);
    }
  }

  function addRestockItem(productId: number) {
    setRestockItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) return prev.map((i) => i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId, quantity: 1 }];
    });
  }

  function updateRestockQty(productId: number, qty: number) {
    if (qty <= 0) {
      setRestockItems((prev) => prev.filter((i) => i.productId !== productId));
      return;
    }
    setRestockItems((prev) => prev.map((i) => i.productId === productId ? { ...i, quantity: qty } : i));
  }

  async function handleSubmitRestock(e: React.FormEvent) {
    e.preventDefault();
    if (!supplierName || restockItems.length === 0) return;
    setSubmitting(true);
    try {
      await createTransaction({
        buyerName: supplierName,
        buyerAddress: "Company Restock",
        buyerContact: "",
        paymentMethod: "Company Restock",
        deliveryMethod: "WalkIn",
        transactionType: "Restock",
        transactionStatus: "Completed",
        grandTotal: 0,
        items: restockItems.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: 0,
          totalPrice: 0,
        })),
      });
      setShowNew(false);
      setSupplierName("");
      setRestockItems([]);
      load();
    } catch (e) {
      console.error("Failed to create restock", e);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="space-y-5"><PageHeader title="Restocks" subtitle="Loading..." /><CardSkeleton count={4} /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <PageHeader title="Restocks" subtitle={`${restocks.length} restock record${restocks.length !== 1 ? "s" : ""} — track and process inventory replenishment from suppliers.`} />
        <div className="flex items-center gap-3">
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#fd761a] to-[#e56600] text-white text-sm font-semibold rounded-lg shadow-lg shadow-[#fd761a]/20 hover:shadow-xl transition-all active:scale-[0.98]">
            <Plus className="h-4 w-4" /> New Restock
          </button>
          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search restocks..." className="w-full pl-9 pr-3 py-2 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a]" />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((r) => {
          const isExpanded = expandedId === r.id;
          const isProcessed = r.transactionStatus === "Completed";
          return (
            <div key={r.id} className={`bg-white border rounded-xl overflow-hidden hover:shadow-md transition-shadow ${isProcessed ? "border-emerald-200" : "border-[#e2e8f0]"}`}>
              <div className="p-4 flex items-center gap-4">
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${isProcessed ? "bg-emerald-50 text-emerald-600" : "bg-purple-50 text-purple-600"}`}>
                  {isProcessed ? <CheckCircle className="h-5 w-5" /> : <ArrowDownUp className="h-5 w-5" />}
                </div>
                <div className="flex-1 grid grid-cols-5 gap-4 text-sm">
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
                  <div>
                    <p className="text-[10px] font-semibold text-[#94a3b8] uppercase">Status</p>
                    <p className={`mt-0.5 text-xs font-semibold ${isProcessed ? "text-emerald-600" : "text-amber-600"}`}>
                      {isProcessed ? "Processed" : "Pending"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isProcessed && (
                    <button onClick={() => handleProcess(r.id)} disabled={processingId === r.id}
                      className="px-4 py-2 bg-gradient-to-r from-[#fd761a] to-[#e56600] text-white text-xs font-semibold rounded-lg shadow-lg shadow-[#fd761a]/20 hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-1.5">
                      {processingId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                      Process
                    </button>
                  )}
                  <button onClick={() => setExpandedId(isExpanded ? null : r.id)} className="p-1.5 text-[#94a3b8] hover:bg-[#f1f5f9] rounded-lg transition-all">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
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
                          <td className="py-2 text-[#0e212c] font-medium">{products.find(p => p.id === item.productId)?.productName || `#${item.productId}`}</td>
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
            <p className="text-xs mt-1">Create a new restock to start tracking inventory replenishment.</p>
          </div>
        )}
      </div>

      {/* New Restock Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center" onClick={() => { setShowNew(false); setSupplierName(""); setRestockItems([]); }}>
          <div className="bg-white rounded-xl shadow-2xl border border-[#e2e8f0] w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#e2e8f0]">
              <h2 className="text-lg font-bold text-[#0e212c] flex items-center gap-2">
                <ArrowDownUp className="h-5 w-5 text-[#fd761a]" /> New Restock
              </h2>
              <button onClick={() => { setShowNew(false); setSupplierName(""); setRestockItems([]); }} className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b] transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmitRestock} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">Supplier Name *</label>
                <input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} required
                  placeholder="e.g. Megaworld Trading"
                  className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-2">Products to Restock</label>
                <div className="max-h-64 overflow-y-auto border border-[#e2e8f0] rounded-lg divide-y divide-[#e2e8f0]">
                  {products.map((p) => {
                    const inRestock = restockItems.find((i) => i.productId === p.id);
                    const imgUrl = (p as any).imageUrl;
                    return (
                      <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#f8fafc] transition-colors">
                        {imgUrl ? (
                          <img src={imgUrl} alt="" className="w-8 h-8 rounded object-cover border border-[#e2e8f0]" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-center">
                            <Package className="h-4 w-4 text-[#94a3b8]" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#0e212c] truncate">{p.productName}</p>
                          <p className="text-xs text-[#94a3b8]">Stock: {p.quantity} &middot; {p.category}</p>
                        </div>
                        {inRestock ? (
                          <div className="flex items-center gap-1.5">
                            <button type="button" onClick={() => updateRestockQty(p.id, inRestock.quantity - 1)}
                              className="p-1 rounded hover:bg-[#f1f5f9] text-[#64748b] transition-colors"><Minus className="h-3.5 w-3.5" /></button>
                            <input type="number" min={1} value={inRestock.quantity}
                              onChange={(e) => updateRestockQty(p.id, Math.max(1, Number(e.target.value) || 1))}
                              className="w-12 text-center text-sm font-semibold text-[#0e212c] bg-transparent border border-[#e2e8f0] rounded py-1 focus:outline-none focus:border-[#fd761a] [appearance:textfield]" />
                            <button type="button" onClick={() => updateRestockQty(p.id, inRestock.quantity + 1)}
                              className="p-1 rounded hover:bg-[#f1f5f9] text-[#64748b] transition-colors"><Plus className="h-3.5 w-3.5" /></button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => addRestockItem(p.id)}
                            className="px-3 py-1.5 text-xs font-semibold text-[#fd761a] border border-[#fd761a]/30 rounded-lg hover:bg-[#fd761a]/5 transition-colors">
                            + Add
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {restockItems.length > 0 && (
                <div className="bg-[#f8fafc] rounded-lg p-4 border border-[#e2e8f0]">
                  <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-2">{restockItems.length} item{restockItems.length !== 1 ? "s" : ""} to restock</p>
                  {restockItems.map((item) => {
                    const p = products.find((pr) => pr.id === item.productId);
                    return (
                      <div key={item.productId} className="flex items-center justify-between text-sm py-1">
                        <span className="text-[#0e212c] font-medium">{p?.productName || `#${item.productId}`}</span>
                        <span className="text-[#64748b]">Qty: {item.quantity}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowNew(false); setSupplierName(""); setRestockItems([]); }}
                  className="flex-1 py-2.5 border border-[#e2e8f0] text-sm font-medium text-[#64748b] rounded-lg hover:bg-[#f8fafc] transition-all">Cancel</button>
                <button type="submit" disabled={submitting || !supplierName || restockItems.length === 0}
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#fd761a] to-[#e56600] text-white text-sm font-semibold rounded-lg shadow-lg shadow-[#fd761a]/20 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</> : <><Plus className="h-4 w-4" /> Create Restock</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
