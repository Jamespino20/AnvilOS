"use client";

import { useState, useEffect, useMemo } from "react";
import { getTransactions, getTransactionsCount, getProducts, processRestock, createTransaction } from "@/actions";
import { Search, ArrowDownUp, Loader2, ChevronDown, ChevronUp, CheckCircle, Plus, ShoppingCart, Minus, Package, X, Truck, ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/skeleton";
import { ExportDialog } from "@/components/export-dialog";
import { ImportButton } from "@/components/import-button";
import type { Transaction, TransactionItem, Product } from "@prisma/client";
import { toast } from "sonner";

type TxnWithItems = Transaction & { items: TransactionItem[] };

const DATE_SCOPES = [
  { label: "All", value: "all" },
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "This Year", value: "year" },
];

function getDateScopeStart(scope: string): string | undefined {
  const now = new Date();
  switch (scope) {
    case "today": return now.toISOString().split("T")[0];
    case "week": {
      const d = new Date(now);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      d.setDate(diff);
      return d.toISOString().split("T")[0];
    }
    case "month": return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    case "year": return new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0];
    default: return undefined;
  }
}

export default function RestocksPage() {
  const [restocks, setRestocks] = useState<TxnWithItems[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateScope, setDateScope] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [showNew, setShowNew] = useState(false);

  // New restock cart state
  const [cart, setCart] = useState<{ productId: number; productName: string; quantity: number; costPrice: number }[]>([]);
  const [restockSearch, setRestockSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const perPage = 10;
  const totalPages = Math.ceil(total / perPage);

  function refresh(p?: number) {
    setLoading(true);
    const pNum = p ?? page;
    const startDate = getDateScopeStart(dateScope);
    Promise.all([
      getTransactions({ type: "Restock", search: search || undefined, startDate, page: pNum, perPage }),
      getTransactionsCount({ type: "Restock", search: search || undefined, startDate }),
      getProducts({}),
    ]).then(([data, count, prods]) => {
      setRestocks(data as TxnWithItems[]);
      setTotal(count);
      setProducts(prods as Product[]);
      setLoading(false);
    });
  }

  useEffect(() => { refresh(); }, [search, page, dateScope]);

  async function handleProcess(id: number) {
    setProcessingId(id);
    try {
      await processRestock(id);
      refresh();
      toast.success("Restock processed successfully");
    } catch (e) {
      console.error("Failed to process restock", e);
      toast.error("Failed to process restock");
    } finally {
      setProcessingId(null);
    }
  }

  const filteredProducts = useMemo(
    () => products.filter((p) => p.productName.toLowerCase().includes(restockSearch.toLowerCase())),
    [products, restockSearch]
  );

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) return prev.map((i) => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId: product.id, productName: product.productName, quantity: 1, costPrice: 0 }];
    });
  }

  function updateCartQty(productId: number, delta: number) {
    setCart((prev) =>
      prev.map((i) => i.productId === productId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i)
        .filter((i) => i.quantity > 0)
    );
  }

  const [editingQty, setEditingQty] = useState<number | null>(null);
  const [qtyInput, setQtyInput] = useState("");

  function startQtyEdit(productId: number, currentQty: number) {
    setEditingQty(productId);
    setQtyInput(String(currentQty));
  }

  function commitQtyEdit(productId: number) {
    const val = parseInt(qtyInput, 10);
    if (!isNaN(val) && val > 0) {
      setCart((prev) =>
        prev.map((i) => i.productId === productId ? { ...i, quantity: val } : i)
      );
    }
    setEditingQty(null);
    setQtyInput("");
  }

  function removeFromCart(productId: number) {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }

  async function handleSubmitRestock(e: React.FormEvent) {
    e.preventDefault();
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const totalCost = cart.reduce((sum, i) => sum + i.costPrice * i.quantity, 0);
      await createTransaction({
        buyerName: "CWL Hardware (Company Restock)",
        buyerAddress: "Company Restock",
        buyerContact: "",
        paymentMethod: "Company Restock",
        deliveryMethod: "WalkIn",
        transactionType: "Restock",
        transactionStatus: "Ongoing",
        grandTotal: totalCost,
        items: cart.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.costPrice,
          totalPrice: i.costPrice * i.quantity,
          costPrice: i.costPrice,
        })),
      });
      setShowNew(false);
      setCart([]);
      setRestockSearch("");
      setPage(1);
      refresh(1);
      toast.success("Restock created successfully");
    } catch (e) {
      console.error("Failed to create restock", e);
      toast.error("Failed to create restock");
    } finally {
      setSubmitting(false);
    }
  }

  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);

  if (loading) return <div className="space-y-5"><PageHeader title="Restocks" subtitle="Loading..." /><TableSkeleton rows={6} cols={4} /></div>;

  return (
    <div className="space-y-5">
      <PageHeader title="Restocks" subtitle={`${total} restock record${total !== 1 ? "s" : ""} — track and process inventory replenishment.`} />

      <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative w-full lg:flex-1 min-w-0 sm:min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by supplier name, receipt #..."
            className="w-full h-10 pl-10 pr-4 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10" />
        </div>
        <div className="flex gap-2 w-full lg:w-auto flex-wrap">
          <div className="flex items-center gap-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-1">
            {DATE_SCOPES.map((s) => (
              <button key={s.value} onClick={() => { setDateScope(s.value); setPage(1); }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${dateScope === s.value ? "bg-[#fd761a] text-white shadow-sm" : "text-[#64748b] hover:text-[#0e212c]"}`}>
                {s.label}
              </button>
            ))}
          </div>
          <ExportDialog
            filename={`cwl-hardware-restocks${dateScope !== "all" ? `-${getDateScopeStart(dateScope) || ""}` : ""}-${new Date().toISOString().slice(0, 10)}.csv`}
            allColumns={[
              { key: "receiptNumber", label: "Receipt #" },
              { key: "items", label: "Items" },
              { key: "grandTotal", label: "Total" },
              { key: "transactionDate", label: "Date" },
              { key: "transactionStatus", label: "Status" },
            ]}
            fetchRows={async (selectedColumns) => restocks.map((r) =>
              selectedColumns.map((key) => {
                if (key === "receiptNumber") return String(r.receiptNumber);
                if (key === "items") return String(r.items.length);
                if (key === "grandTotal") {
                  const total = r.items.reduce((s, i) => s + Number(i.costPrice || i.unitPrice || 0) * (i.quantity || 0), 0);
                  return `${total.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                }
                if (key === "transactionDate") return new Date(r.transactionDate).toLocaleDateString("en-PH");
                if (key === "transactionStatus") return r.transactionStatus;
                return "";
              })
            )}
            label="Export"
            title="Export restocks"
            filterLabel={dateScope !== "all" ? DATE_SCOPES.find((s) => s.value === dateScope)?.label : undefined}
          />
          <ImportButton table="transactions" onImported={() => window.location.reload()} title="Import restocks from CSV or XLSX" />
          <button onClick={() => setShowNew(true)}
            className="h-10 flex items-center justify-center gap-2 px-5 bg-gradient-to-r from-[#fd761a] to-[#e56600] text-white text-sm font-semibold rounded-lg shadow-lg shadow-[#fd761a]/20 hover:shadow-xl transition-all active:scale-[0.98]">
            <Plus className="h-4 w-4" /> New Restock
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {restocks.map((r) => {
          const isExpanded = expandedId === r.id;
          const isProcessed = r.transactionStatus === "Completed";
          return (
            <div key={r.id} className={`bg-white border rounded-xl overflow-hidden hover:shadow-md transition-shadow ${isProcessed ? "border-emerald-200" : "border-[#e2e8f0]"}`}>
              <div className="p-4 flex items-center gap-4">
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${isProcessed ? "bg-emerald-50 text-emerald-600" : "bg-purple-50 text-purple-600"}`}>
                  {isProcessed ? <CheckCircle className="h-5 w-5" /> : <ArrowDownUp className="h-5 w-5" />}
                </div>
                <div className="flex-1 grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-[10px] font-semibold text-[#94a3b8] uppercase">Receipt</p>
                    <p className="font-mono text-[#0e212c] font-medium mt-0.5">#{r.receiptNumber}</p>
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
                      {processingId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Truck className="h-3.5 w-3.5" />}
                      Receive Stock
                    </button>
                  )}
                  <button onClick={() => setExpandedId(isExpanded ? null : r.id)} className="p-1.5 text-[#94a3b8] hover:bg-[#f1f5f9] rounded-lg transition-all">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
              </div>

            </div>
          );
        })}
        {restocks.length === 0 && (
          <div className="text-center py-16 text-[#94a3b8]">
            <ArrowDownUp className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No restocks recorded</p>
            <p className="text-xs mt-1">Create a new restock to start tracking inventory replenishment.</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
            className="px-3 py-1.5 border border-[#e2e8f0] rounded-lg text-[#64748b] hover:bg-white disabled:opacity-50 transition-all flex items-center gap-1">
            <ChevronLeft className="h-3.5 w-3.5" /> Prev
          </button>
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
            const startPage = Math.max(1, page - 4);
            const p = startPage + i;
            if (p > totalPages) return null;
            return (
              <button key={p} onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${p === page ? "bg-[#fd761a] text-white" : "text-[#64748b] hover:bg-[#f1f5f9]"}`}>
                {p}
              </button>
            );
          })}
          <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
            className="px-3 py-1.5 border border-[#e2e8f0] rounded-lg text-[#64748b] hover:bg-white disabled:opacity-50 transition-all flex items-center gap-1">
            Next <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* New Restock Modal - POS Cart Layout */}
      {showNew && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl border border-[#e2e8f0] w-full max-w-6xl mx-4 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-8 py-6 border-b border-[#e2e8f0]">
              <h2 className="text-lg font-bold text-[#0e212c] flex items-center gap-2">
                <ArrowDownUp className="h-5 w-5 text-[#fd761a]" /> New Restock
              </h2>
              <button onClick={() => { setShowNew(false); setCart([]); setRestockSearch(""); }} className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b] transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex flex-col lg:flex-row gap-0 flex-1 overflow-hidden">
              {/* Product selection area */}
              <div className="lg:flex-[2] p-8 overflow-y-auto border-b lg:border-b-0 lg:border-r border-[#e2e8f0] space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
                  <input type="text" value={restockSearch} onChange={(e) => setRestockSearch(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-9 pr-4 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a]" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredProducts.map((p) => {
                    const inCart = cart.find((i) => i.productId === p.id);
                    const imgUrl = (p as any).imageUrl;
                    return (
                      <button key={p.id} type="button" onClick={() => addToCart(p)}
                        className={`bg-white border rounded-xl p-3 text-left hover:shadow-md transition-all group ${inCart ? "border-[#fd761a] bg-[#fff5ed]" : "border-[#e2e8f0]"}`}>
                        {imgUrl ? (
                          <img src={imgUrl} alt="" className="w-full h-16 object-cover rounded-lg mb-2 border border-[#e2e8f0]" />
                        ) : (
                          <div className="w-full h-16 rounded-lg mb-2 bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-center">
                            <Package className="h-6 w-6 text-[#94a3b8]" />
                          </div>
                        )}
                        <p className="text-xs font-medium text-[#0e212c] leading-snug line-clamp-2">{p.productName}</p>
                        <p className="text-[10px] text-[#94a3b8] mt-1">Stock: {p.quantity}</p>
                        {inCart && <p className="text-[10px] text-[#fd761a] font-semibold mt-1">{inCart.quantity} in cart</p>}
                      </button>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <div className="col-span-3 text-center py-8 text-[#94a3b8] text-sm">No products match your search</div>
                  )}
                </div>
              </div>

              {/* Cart area */}
              <div className="flex-1 p-8 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-bold text-[#0e212c] flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-[#fd761a]" /> Cart
                  </h3>
                  {cart.length > 0 && <span className="text-xs text-[#fd761a] font-semibold">{totalItems} item{totalItems !== 1 ? "s" : ""}</span>}
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 mb-5">
                  {cart.map((item) => (
                    <div key={item.productId} className="bg-[#f8fafc] rounded-lg p-3 space-y-2 hover:bg-[#f1f5f9] transition-colors group">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-medium text-[#0e212c] leading-tight flex-1">{item.productName}</p>
                        <button type="button" onClick={() => removeFromCart(item.productId)} className="w-7 h-7 flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all shrink-0 opacity-0 group-hover:opacity-100"><X className="h-3.5 w-3.5" /></button>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">Per unit</span>
                          <input type="number" min={0} step={0.01} value={item.costPrice} onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setCart((prev) => prev.map((i) => i.productId === item.productId ? { ...i, costPrice: val } : i));
                          }} className="w-24 h-8 px-2.5 text-xs text-right font-mono border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#fd761a]" placeholder="0.00" />
                        </div>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => updateCartQty(item.productId, -1)} className="w-8 h-8 flex items-center justify-center bg-white border border-[#e2e8f0] rounded-lg text-[#64748b] active:bg-[#fd761a] active:text-white transition-colors" aria-label="Decrease quantity"><Minus className="h-3.5 w-3.5" /></button>
                          {editingQty === item.productId ? (
                            <input type="number" min={1} value={qtyInput} autoFocus
                              onChange={(e) => setQtyInput(e.target.value)}
                              onBlur={() => commitQtyEdit(item.productId)}
                              onKeyDown={(e) => { if (e.key === "Enter") { (e.target as HTMLInputElement).blur(); } if (e.key === "Escape") { setEditingQty(null); } }}
                              className="w-12 h-8 text-center text-xs font-semibold text-[#0e212c] border border-[#fd761a] rounded-lg px-1 focus:outline-none" />
                          ) : (
                            <button type="button" onClick={() => startQtyEdit(item.productId, item.quantity)} className="min-w-[36px] h-8 text-center text-xs font-semibold text-[#0e212c] px-1.5 hover:bg-white rounded-lg transition-colors" aria-label="Edit quantity">{item.quantity}</button>
                          )}
                          <button type="button" onClick={() => updateCartQty(item.productId, 1)} className="w-8 h-8 flex items-center justify-center bg-white border border-[#e2e8f0] rounded-lg text-[#64748b] active:bg-[#fd761a] active:text-white transition-colors" aria-label="Increase quantity"><Plus className="h-3.5 w-3.5" /></button>
                        </div>
                        <div className="ml-auto text-right">
                          <p className="text-[11px] text-[#64748b]">Subtotal</p>
                          <p className="text-xs font-bold text-[#0e212c]">{(item.costPrice * item.quantity).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {cart.length === 0 && (
                    <p className="text-xs text-[#94a3b8] text-center py-6">Select products to restock</p>
                  )}
                </div>
                <button onClick={handleSubmitRestock} disabled={cart.length === 0 || submitting}
                  className="w-full py-2.5 bg-gradient-to-r from-[#fd761a] to-[#e56600] text-white text-xs font-semibold rounded-lg shadow-lg shadow-[#fd761a]/20 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</> : <><Truck className="h-4 w-4" /> Record Restock ({totalItems} items)</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {expandedId !== null && (() => {
        const restock = restocks.find((r) => r.id === expandedId);
        if (!restock) return null;
        const grandTotal = restock.items.reduce((s, i) => s + Number(i.costPrice || i.unitPrice || 0) * (i.quantity || 0), 0);
        return (
          <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-[#e2e8f0] w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
                <div>
                  <h2 className="text-lg font-bold text-[#0e212c] flex items-center gap-2">
                    <ArrowDownUp className="h-5 w-5 text-[#fd761a]" /> Restock #{restock.receiptNumber}
                  </h2>
                  <p className="text-xs text-[#64748b] mt-1">
                    {restock.buyerName} &middot; {new Date(restock.transactionDate).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <button onClick={() => setExpandedId(null)} className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b] transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="overflow-y-auto p-6 space-y-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">
                      <th className="text-left pb-2">Product</th>
                      <th className="text-right pb-2">Qty</th>
                      <th className="text-right pb-2">Cost Price</th>
                      <th className="text-right pb-2">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e8f0]">
                    {restock.items.map((item) => {
                      const prod = products.find((p) => p.id === item.productId);
                      const cost = Number(item.costPrice || item.unitPrice || 0);
                      return (
                        <tr key={item.id}>
                          <td className="py-2.5 text-[#0e212c] font-medium">{prod?.productName || `#${item.productId}`}</td>
                          <td className="py-2.5 text-right text-[#64748b]">{item.quantity}</td>
                          <td className="py-2.5 text-right text-[#64748b] font-mono">{cost.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="py-2.5 text-right text-[#0e212c] font-semibold font-mono">{(cost * (item.quantity || 0)).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-[#e2e8f0]">
                      <td colSpan={3} className="pt-3 text-right text-sm font-semibold text-[#0e212c]">Grand Total</td>
                      <td className="pt-3 text-right text-sm font-bold text-[#fd761a] font-mono">{grandTotal.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  </tfoot>
                </table>
                {(restock.deliveryRef || restock.deliveryNotes || restock.delivererName) && (
                  <div className="bg-[#f8fafc] rounded-lg p-4 space-y-1 text-xs text-[#64748b]">
                    {restock.delivererName && <p><span className="font-semibold text-[#0e212c]">Deliverer:</span> {restock.delivererName}</p>}
                    {restock.deliveryRef && <p><span className="font-semibold text-[#0e212c]">Delivery Ref:</span> {restock.deliveryRef}</p>}
                    {restock.deliveryNotes && <p><span className="font-semibold text-[#0e212c]">Notes:</span> {restock.deliveryNotes}</p>}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}




