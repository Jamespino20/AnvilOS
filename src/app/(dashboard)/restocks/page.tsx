"use client";

import { useState, useEffect, useMemo } from "react";
import { getTransactions, getProducts, processRestock, createTransaction } from "@/actions";
import { Search, ArrowDownUp, Loader2, ChevronDown, ChevronUp, CheckCircle, Plus, ShoppingCart, Minus, Package, X, Truck } from "lucide-react";
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

  // New restock cart state
  const [cart, setCart] = useState<{ productId: number; productName: string; quantity: number }[]>([]);
  const [restockSearch, setRestockSearch] = useState("");
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

  const filteredProducts = useMemo(
    () => products.filter((p) => p.productName.toLowerCase().includes(restockSearch.toLowerCase())),
    [products, restockSearch]
  );

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) return prev.map((i) => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId: product.id, productName: product.productName, quantity: 1 }];
    });
  }

  function updateCartQty(productId: number, delta: number) {
    setCart((prev) =>
      prev.map((i) => i.productId === productId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i)
        .filter((i) => i.quantity > 0)
    );
  }

  function removeFromCart(productId: number) {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }

  async function handleSubmitRestock(e: React.FormEvent) {
    e.preventDefault();
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      await createTransaction({
        buyerName: "CWL Hardware (Company Restock)",
        buyerAddress: "Company Restock",
        buyerContact: "",
        paymentMethod: "Company Restock",
        deliveryMethod: "WalkIn",
        transactionType: "Restock",
        transactionStatus: "Completed",
        grandTotal: 0,
        items: cart.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: 0,
          totalPrice: 0,
        })),
      });
      setShowNew(false);
      setCart([]);
      setRestockSearch("");
      load();
    } catch (e) {
      console.error("Failed to create restock", e);
    } finally {
      setSubmitting(false);
    }
  }

  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);

  if (loading) return <div className="space-y-5"><PageHeader title="Restocks" subtitle="Loading..." /><CardSkeleton count={4} /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <PageHeader title="Restocks" subtitle={`${restocks.length} restock record${restocks.length !== 1 ? "s" : ""} — track and process inventory replenishment.`} />
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
              {isExpanded && (
                <div className="border-t border-[#e2e8f0] bg-[#f8fafc] p-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">
                        <th className="text-left pb-2">Product</th>
                        <th className="text-right pb-2">Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e2e8f0]">
                      {r.items.map((item) => (
                        <tr key={item.id}>
                          <td className="py-2 text-[#0e212c] font-medium">{products.find(p => p.id === item.productId)?.productName || `#${item.productId}`}</td>
                          <td className="py-2 text-right text-[#64748b]">{item.quantity}</td>
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

      {/* New Restock Modal - POS Cart Layout */}
      {showNew && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center" onClick={() => { setShowNew(false); setCart([]); setRestockSearch(""); }}>
          <div className="bg-white rounded-xl shadow-2xl border border-[#e2e8f0] w-full max-w-3xl mx-4 max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#e2e8f0]">
              <h2 className="text-lg font-bold text-[#0e212c] flex items-center gap-2">
                <ArrowDownUp className="h-5 w-5 text-[#fd761a]" /> New Restock
              </h2>
              <button onClick={() => { setShowNew(false); setCart([]); setRestockSearch(""); }} className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b] transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex gap-0 flex-1 overflow-hidden">
              {/* Product selection area */}
              <div className="flex-[2] p-6 overflow-y-auto border-r border-[#e2e8f0] space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
                  <input type="text" value={restockSearch} onChange={(e) => setRestockSearch(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-9 pr-4 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a]" />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
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
                        <p className="text-xs font-medium text-[#0e212c] truncate">{p.productName}</p>
                        <p className="text-[10px] text-[#94a3b8] mt-0.5">Stock: {p.quantity}</p>
                        {inCart && <p className="text-[10px] text-[#fd761a] font-semibold mt-0.5">{inCart.quantity} in cart</p>}
                      </button>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <div className="col-span-2 text-center py-8 text-[#94a3b8] text-sm">No products match your search</div>
                  )}
                </div>
              </div>

              {/* Cart area */}
              <div className="flex-1 p-6 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-[#0e212c] flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-[#fd761a]" /> Cart
                  </h3>
                  {cart.length > 0 && <span className="text-xs text-[#fd761a] font-semibold">{totalItems} item{totalItems !== 1 ? "s" : ""}</span>}
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                  {cart.map((item) => (
                    <div key={item.productId} className="flex items-center gap-2 bg-[#f8fafc] rounded-lg p-2.5 group hover:bg-[#f1f5f9] transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#0e212c] truncate">{item.productName}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => updateCartQty(item.productId, -1)} className="p-1 rounded hover:bg-white text-[#64748b] transition-colors"><Minus className="h-3 w-3" /></button>
                        <span className="w-8 text-center text-xs font-semibold text-[#0e212c]">{item.quantity}</span>
                        <button type="button" onClick={() => updateCartQty(item.productId, 1)} className="p-1 rounded hover:bg-white text-[#64748b] transition-colors"><Plus className="h-3 w-3" /></button>
                      </div>
                      <button type="button" onClick={() => removeFromCart(item.productId)} className="p-1 rounded text-[#e2e8f0] hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"><X className="h-3 w-3" /></button>
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
    </div>
  );
}
