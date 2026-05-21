"use client";

import { useState, useMemo } from "react";
import { Search, Plus, Minus, Trash2, ShoppingCart, User, MapPin, Phone, Loader2, CheckCircle, Package, ArrowDownUp, RotateCcw, AlertTriangle } from "lucide-react";
import { createTransaction } from "@/actions";
import type { Product } from "@prisma/client";

interface Props {
  products: Product[];
}

interface CartItem {
  product: Product;
  quantity: number;
}

const TXN_TYPES = [
  { value: "SaleWalkIn" as const, label: "Sale Walk-In", icon: ShoppingCart },
  { value: "SalePO" as const, label: "Sale P.O.", icon: Package },
  { value: "Return" as const, label: "Return", icon: RotateCcw },
  { value: "Restock" as const, label: "Restock", icon: ArrowDownUp },
  { value: "Damage" as const, label: "Damage", icon: AlertTriangle },
  { value: "Adjustment" as const, label: "Adjustment", icon: ArrowDownUp },
];

export function POSClient({ products }: Props) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [buyerName, setBuyerName] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [buyerContact, setBuyerContact] = useState("");
  const [txnType, setTxnType] = useState<typeof TXN_TYPES[number]["value"]>("SaleWalkIn");
  const [returnReceipt, setReturnReceipt] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);
  const [done, setDone] = useState<{ receipt: number } | null>(null);
  const [error, setError] = useState("");

  const categories = useMemo(() => [...new Set(products.map((p) => p.category))], [products]);

  const filtered = products.filter((p) => {
    if (search && !p.productName.toLowerCase().includes(search.toLowerCase())) return false;
    if (category && p.category !== category) return false;
    if (txnType === "Return") return p.quantity > 0; // can only return items that were sold
    return true;
  });

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing) return prev.map((c) => (c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c));
      return [...prev, { product, quantity: 1 }];
    });
  }

  function updateQuantity(productId: number, delta: number) {
    setCart((prev) =>
      prev.map((c) => (c.product.id === productId ? { ...c, quantity: Math.max(1, c.quantity + delta) } : c))
        .filter((c) => c.quantity > 0)
    );
  }

  function removeFromCart(productId: number) {
    setCart((prev) => prev.filter((c) => c.product.id !== productId));
  }

  const grandTotal = useMemo(
    () => cart.reduce((sum, c) => sum + Number(c.product.unitPrice) * c.quantity, 0),
    [cart]
  );

  async function handleCheckout() {
    if (cart.length === 0 || !buyerName) return;
    setError("");
    setCheckingOut(true);
    try {
      const result = await createTransaction({
        buyerName,
        buyerAddress,
        buyerContact,
        transactionType: txnType,
        transactionStatus: txnType === "SaleWalkIn" || txnType === "Return" || txnType === "Adjustment" ? "Completed" : "Ongoing",
        grandTotal,
        items: cart.map((c) => ({
          productId: c.product.id,
          quantity: c.quantity,
          unitPrice: Number(c.product.unitPrice),
          totalPrice: Number(c.product.unitPrice) * c.quantity,
        })),
        returnForReceiptNumber: txnType === "Return" ? Number(returnReceipt) || undefined : undefined,
      });
      setDone({ receipt: result.receiptNumber });
      setCart([]);
      setBuyerName("");
      setBuyerAddress("");
      setBuyerContact("");
      setReturnReceipt("");
      setTimeout(() => setDone(null), 5000);
    } catch (e: any) {
      setError(e.message || "Transaction failed");
    } finally {
      setCheckingOut(false);
    }
  }

  function getTxnTypeColor(type: typeof TXN_TYPES[number]["value"]) {
    const colors: Record<string, string> = {
      SaleWalkIn: "border-emerald-500 text-emerald-600",
      SalePO: "border-blue-500 text-blue-600",
      Return: "border-amber-500 text-amber-600",
      Restock: "border-purple-500 text-purple-600",
      Damage: "border-rose-500 text-rose-600",
      Adjustment: "border-slate-500 text-slate-600",
    };
    return colors[type] || "border-gray-500 text-gray-600";
  }

  return (
    <div className="flex gap-5 h-[calc(100vh-8rem)]">
      <div className="flex-[2] flex flex-col gap-4">
        {/* Transaction Type Tabs */}
        <div className="flex gap-1.5 flex-wrap">
          {TXN_TYPES.map((t) => {
            const active = txnType === t.value;
            return (
              <button key={t.value} onClick={() => { setTxnType(t.value); setCart([]); setError(""); }}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all duration-200 border ${
                  active
                    ? `bg-white shadow-sm ${getTxnTypeColor(t.value)} border-current`
                    : "border-[#e2e8f0] text-[#94a3b8] hover:bg-white hover:border-[#cbd5e1]"
                }`}>
                <t.icon className="h-3.5 w-3.5" /> {t.label}
              </button>
            );
          })}
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="w-full pl-10 pr-4 py-2.5 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10" />
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="min-w-[160px] px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a]">
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {txnType === "Return" && (
          <div className="flex gap-3 items-center bg-amber-50 border border-amber-200 rounded-lg p-3">
            <RotateCcw className="h-4 w-4 text-amber-600 shrink-0" />
            <input type="number" value={returnReceipt} onChange={(e) => setReturnReceipt(e.target.value)}
              placeholder="Original receipt number" className="flex-1 px-3 py-2 border border-amber-200 rounded-lg text-sm bg-white focus:outline-none focus:border-amber-400" />
            <span className="text-xs text-amber-600 font-medium">Enter the original sale receipt to return against</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto grid grid-cols-2 lg:grid-cols-3 gap-3 content-start">
          {filtered.map((product) => (
            <button key={product.id} onClick={() => addToCart(product)}
              className="bg-white border border-[#e2e8f0] rounded-xl p-4 text-left hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5 transition-all duration-200 group">
              <p className="font-semibold text-sm text-[#0e212c] truncate group-hover:text-[#fd761a] transition-colors">{product.productName}</p>
              <p className="text-lg font-bold text-[#fd761a] mt-1">₱{Number(product.unitPrice).toLocaleString()}</p>
              <p className={`text-xs mt-1 ${product.quantity <= product.minThreshold ? "text-rose-500 font-semibold" : "text-[#94a3b8]"}`}>
                Stock: {product.quantity} {product.quantity <= product.minThreshold && product.quantity > 0 ? "(Low)" : product.quantity === 0 ? "(Out)" : ""}
              </p>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-[#94a3b8]">No products match your search</div>
          )}
        </div>
      </div>

      <div className="flex-1 bg-white border border-[#e2e8f0] rounded-xl flex flex-col shadow-sm">
        <div className="p-5 border-b border-[#e2e8f0] space-y-3">
          <h2 className="font-semibold text-[#0e212c] flex items-center gap-2 text-sm">
            <ShoppingCart className="h-4 w-4 text-[#fd761a]" /> Cart
            {cart.length > 0 && <span className="ml-auto text-[#fd761a]">{cart.length} item{cart.length > 1 ? "s" : ""}</span>}
          </h2>
          <div className="space-y-2.5 text-sm">
            {[{ icon: User, placeholder: "Buyer/Supplier name *", value: buyerName, set: setBuyerName },
              { icon: MapPin, placeholder: "Address (optional)", value: buyerAddress, set: setBuyerAddress },
              { icon: Phone, placeholder: "Contact (optional)", value: buyerContact, set: setBuyerContact },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <f.icon className="h-3.5 w-3.5 text-[#94a3b8]" />
                <input type="text" value={f.value} onChange={(e) => f.set(e.target.value)} placeholder={f.placeholder}
                  className="flex-1 border-b border-[#e2e8f0] py-1.5 text-sm text-[#0e212c] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#fd761a] transition-colors" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {cart.map((item) => (
            <div key={item.product.id} className="flex items-center gap-3 bg-[#f8fafc] rounded-lg p-3 group hover:bg-[#f1f5f9] transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#0e212c] truncate">{item.product.productName}</p>
                <p className="text-xs text-[#94a3b8]">₱{Number(item.product.unitPrice).toLocaleString()} ea</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => updateQuantity(item.product.id, -1)} className="p-1.5 rounded-md hover:bg-white text-[#64748b] hover:text-[#0e212c] transition-all"><Minus className="h-3.5 w-3.5" /></button>
                <span className="w-8 text-center text-sm font-semibold text-[#0e212c]">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.product.id, 1)} className="p-1.5 rounded-md hover:bg-white text-[#64748b] hover:text-[#0e212c] transition-all"><Plus className="h-3.5 w-3.5" /></button>
              </div>
              <p className="text-sm font-semibold text-[#0e212c] w-20 text-right font-mono">₱{(Number(item.product.unitPrice) * item.quantity).toLocaleString()}</p>
              <button onClick={() => removeFromCart(item.product.id)} className="p-1.5 rounded-md text-[#e2e8f0] hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
          {cart.length === 0 && (
            <p className="text-sm text-[#94a3b8] text-center py-8">Cart is empty</p>
          )}
        </div>

        {error && (
          <div className="px-5 py-3 bg-rose-50 border-t border-rose-200 text-sm text-rose-700 font-medium">{error}</div>
        )}

        <div className="p-5 border-t border-[#e2e8f0] space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-[#0e212c]">Grand Total</span>
            <span className="text-xl font-bold text-[#fd761a]">₱{grandTotal.toLocaleString()}</span>
          </div>
          {done ? (
            <div className="w-full py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm font-semibold text-center flex items-center justify-center gap-2">
              <CheckCircle className="h-4 w-4" /> Completed — Receipt #{done.receipt}
            </div>
          ) : (
            <button onClick={handleCheckout} disabled={cart.length === 0 || !buyerName || checkingOut}
              className="w-full py-3 bg-gradient-to-r from-[#fd761a] to-[#e56600] text-white rounded-lg font-semibold text-sm hover:from-[#e56600] hover:to-[#d45d00] shadow-lg shadow-[#fd761a]/20 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {checkingOut ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</> : `Process ${TXN_TYPES.find((t) => t.value === txnType)?.label || "Transaction"}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
