"use client";

import { useState, useMemo } from "react";
import { Search, Plus, Minus, Trash2, ShoppingCart, User, MapPin, Phone } from "lucide-react";
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

  const categories = useMemo(() => [...new Set(products.map((p) => p.category))], [products]);

  const filtered = products.filter((p) => {
    if (search && !p.productName.toLowerCase().includes(search.toLowerCase())) return false;
    if (category && p.category !== category) return false;
    return true;
  });

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing) {
        return prev.map((c) => (c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c));
      }
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

  return (
    <div className="flex gap-5 h-[calc(100vh-8rem)]">
      <div className="flex-[2] flex flex-col gap-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="w-full pl-10 pr-4 py-2 border border-outline rounded text-sm" />
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="min-w-[160px] px-3 py-2 border border-outline rounded text-sm">
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 lg:grid-cols-3 gap-3 content-start">
          {filtered.map((product) => (
            <button key={product.id} onClick={() => addToCart(product)} disabled={product.quantity === 0} className="bg-white border border-outline rounded p-3 text-left hover:shadow-md transition-shadow disabled:opacity-50 disabled:cursor-not-allowed">
              <p className="font-semibold text-sm truncate">{product.productName}</p>
              <p className="text-lg font-bold text-secondary mt-1">₱{Number(product.unitPrice).toLocaleString()}</p>
              <p className="text-xs text-on-surface-variant mt-1">Stock: {product.quantity}</p>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-on-surface-variant">No products match your search</div>
          )}
        </div>
      </div>

      <div className="flex-1 bg-white border border-outline rounded flex flex-col">
        <div className="p-4 border-b border-outline space-y-3">
          <h2 className="font-semibold flex items-center gap-2"><ShoppingCart className="h-4 w-4" /> Cart</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-on-surface-variant" />
              <input type="text" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="Buyer name" className="flex-1 border-b border-outline/50 py-1 text-sm focus:outline-none focus:border-primary" />
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-on-surface-variant" />
              <input type="text" value={buyerAddress} onChange={(e) => setBuyerAddress(e.target.value)} placeholder="Address (optional)" className="flex-1 border-b border-outline/50 py-1 text-sm focus:outline-none focus:border-primary" />
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-on-surface-variant" />
              <input type="text" value={buyerContact} onChange={(e) => setBuyerContact(e.target.value)} placeholder="Contact (optional)" className="flex-1 border-b border-outline/50 py-1 text-sm focus:outline-none focus:border-primary" />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.map((item) => (
            <div key={item.product.id} className="flex items-center gap-2 bg-surface-container-low rounded p-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.product.productName}</p>
                <p className="text-xs text-on-surface-variant">₱{Number(item.product.unitPrice).toLocaleString()} ea</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => updateQuantity(item.product.id, -1)} className="p-1 rounded hover:bg-surface-container-high"><Minus className="h-3 w-3" /></button>
                <span className="w-8 text-center text-sm font-mono">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.product.id, 1)} className="p-1 rounded hover:bg-surface-container-high"><Plus className="h-3 w-3" /></button>
              </div>
              <p className="text-sm font-mono w-20 text-right">₱{(Number(item.product.unitPrice) * item.quantity).toLocaleString()}</p>
              <button onClick={() => removeFromCart(item.product.id)} className="p-1 text-error hover:bg-error-container/30 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
          {cart.length === 0 && (
            <p className="text-sm text-on-surface-variant text-center py-8">Cart is empty</p>
          )}
        </div>

        <div className="p-4 border-t border-outline space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Grand Total</span>
            <span className="text-xl font-bold">₱{grandTotal.toLocaleString()}</span>
          </div>
          <button disabled={cart.length === 0 || !buyerName} className="w-full py-3 bg-secondary text-on-secondary rounded-lg font-semibold text-sm hover:bg-secondary/90 transition-colors disabled:opacity-50">
            Complete Transaction
          </button>
        </div>
      </div>
    </div>
  );
}
