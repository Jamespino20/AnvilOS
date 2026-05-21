"use client";

import { useState, useMemo } from "react";
import { Search, Plus, Minus, Trash2, ShoppingCart, User, MapPin, Phone, Loader2, CheckCircle } from "lucide-react";
import { createTransaction } from "@/actions";
import type { Product } from "@prisma/client";

interface Props {
  products: Product[];
}

interface CartItem {
  product: Product;
  quantity: number;
}

export function POSClient({ products }: Props) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [buyerName, setBuyerName] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [buyerContact, setBuyerContact] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);
  const [done, setDone] = useState(false);

  const categories = useMemo(() => [...new Set(products.map((p) => p.category))], [products]);

  const filtered = products.filter((p) => {
    if (search && !p.productName.toLowerCase().includes(search.toLowerCase())) return false;
    if (category && p.category !== category) return false;
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
      prev
        .map((c) => (c.product.id === productId ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c))
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
    setCheckingOut(true);
    try {
      await createTransaction({
        buyerName,
        buyerAddress,
        buyerContact,
        transactionType: "SaleWalkIn",
        transactionStatus: "Completed",
        grandTotal,
        items: cart.map((c) => ({
          productId: c.product.id,
          quantity: c.quantity,
          unitPrice: Number(c.product.unitPrice),
          totalPrice: Number(c.product.unitPrice) * c.quantity,
        })),
      });
      setDone(true);
      setCart([]);
      setBuyerName("");
      setBuyerAddress("");
      setBuyerContact("");
      setTimeout(() => setDone(false), 3000);
    } catch (e) {
      console.error("Checkout failed", e);
    } finally {
      setCheckingOut(false);
    }
  }

  return (
    <div className="flex gap-5 h-[calc(100vh-8rem)]">
      <div className="flex-[2] flex flex-col gap-4">
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

        <div className="flex-1 overflow-y-auto grid grid-cols-2 lg:grid-cols-3 gap-3 content-start">
          {filtered.map((product) => (
            <button key={product.id} onClick={() => addToCart(product)} disabled={product.quantity === 0}
              className="bg-white border border-[#e2e8f0] rounded-xl p-4 text-left hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group">
              <p className="font-semibold text-sm text-[#0e212c] truncate group-hover:text-[#fd761a] transition-colors">{product.productName}</p>
              <p className="text-lg font-bold text-[#fd761a] mt-1">₱{Number(product.unitPrice).toLocaleString()}</p>
              <p className="text-xs text-[#94a3b8] mt-1">Stock: {product.quantity}</p>
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
            <ShoppingCart className="h-4 w-4 text-[#fd761a]" /> Cart {cart.length > 0 && <span className="ml-auto text-[#fd761a]">{cart.length} item{cart.length > 1 ? "s" : ""}</span>}
          </h2>
          <div className="space-y-2.5 text-sm">
            {[{ icon: User, placeholder: "Buyer name *", value: buyerName, set: setBuyerName },
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

        <div className="p-5 border-t border-[#e2e8f0] space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-[#0e212c]">Grand Total</span>
            <span className="text-xl font-bold text-[#fd761a]">₱{grandTotal.toLocaleString()}</span>
          </div>
          <button onClick={handleCheckout} disabled={cart.length === 0 || !buyerName || checkingOut}
            className="w-full py-3 bg-gradient-to-r from-[#fd761a] to-[#e56600] text-white rounded-lg font-semibold text-sm hover:from-[#e56600] hover:to-[#d45d00] shadow-lg shadow-[#fd761a]/20 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {checkingOut ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</> :
             done ? <><CheckCircle className="h-4 w-4" /> Completed ✓</> :
             "Complete Transaction"}
          </button>
        </div>
      </div>
    </div>
  );
}
