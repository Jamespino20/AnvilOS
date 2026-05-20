"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, MoreVertical, Package, AlertTriangle, XCircle, CheckCircle } from "lucide-react";
import type { Product, Category, Supplier } from "@prisma/client";

interface Props {
  products: (Product & { categoryRel: Category | null; supplierRel: Supplier | null })[];
  categories: (Category & { childCategories: Category[]; _count: { products: number } })[];
  suppliers: (Supplier & { _count: { products: number } })[];
}

export function InventoryClient({ products: initialProducts, categories, suppliers }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const filtered = initialProducts.filter((p) => {
    if (search && !p.productName.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCategory && p.categoryId !== Number(filterCategory)) return false;
    if (filterSupplier && p.supplierId !== Number(filterSupplier)) return false;
    if (filterStatus === "low" && (p.quantity > p.minThreshold || p.quantity === 0)) return false;
    if (filterStatus === "out" && p.quantity !== 0) return false;
    return true;
  });

  function statusBadge(product: Product) {
    if (product.quantity === 0) return { label: "OUT OF STOCK", className: "bg-error-container text-on-error-container border border-[#FFB4AB]" };
    if (product.quantity <= product.minThreshold) return { label: "LOW STOCK", className: "bg-[#FFF8E1] text-[#B08D00] border border-[#FFECB3]" };
    return { label: "IN STOCK", className: "bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6]" };
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-on-surface">Inventory Management</h1>
      </div>

      <div className="bg-white border border-outline rounded p-4 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search SKU, Name..." className="w-full pl-10 pr-4 py-2 border border-outline rounded text-sm bg-surface-bright focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
        </div>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="min-w-[160px] px-3 py-2 border border-outline rounded text-sm bg-surface-bright">
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filterSupplier} onChange={(e) => setFilterSupplier(e.target.value)} className="min-w-[160px] px-3 py-2 border border-outline rounded text-sm bg-surface-bright">
          <option value="">All Suppliers</option>
          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.supplierName}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="min-w-[140px] px-3 py-2 border border-outline rounded text-sm bg-surface-bright">
          <option value="">All Status</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>
        <div className="flex gap-2 ml-auto">
          <button className="flex items-center gap-2 px-4 py-2 border border-outline text-sm rounded hover:bg-surface-container-low transition-colors">
            <Package className="h-4 w-4" /> Adjust Stock
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-secondary text-on-secondary text-sm rounded hover:bg-secondary/90 transition-colors">
            <Plus className="h-4 w-4" /> Add Product
          </button>
        </div>
      </div>

      <div className="bg-white border border-outline rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-container-low border-b border-outline">
              <tr>
                <th className="text-left p-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Product Name</th>
                <th className="text-left p-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Category</th>
                <th className="text-left p-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Supplier</th>
                <th className="text-right p-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Price</th>
                <th className="text-right p-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Qty</th>
                <th className="text-right p-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Min Thr.</th>
                <th className="text-center p-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline/50">
              {filtered.map((product, i) => {
                const badge = statusBadge(product);
                return (
                  <tr key={product.id} className={`${i % 2 === 0 ? "" : "bg-[#F8FAFC]"} hover:bg-surface-container-low transition-colors`}>
                    <td className="p-3 font-medium">{product.productName}</td>
                    <td className="p-3 text-on-surface-variant">{product.category}</td>
                    <td className="p-3 text-on-surface-variant">{product.supplierName}</td>
                    <td className="p-3 text-right font-mono">₱{Number(product.unitPrice).toLocaleString()}</td>
                    <td className={`p-3 text-right font-mono ${product.quantity <= product.minThreshold ? "text-secondary-container font-bold" : ""}`}>{product.quantity}</td>
                    <td className="p-3 text-right font-mono text-outline">{product.minThreshold}</td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-on-surface-variant">No products found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-outline p-3 flex items-center justify-between text-sm text-on-surface-variant">
          <span>Showing {filtered.length} of {initialProducts.length} items</span>
        </div>
      </div>
    </div>
  );
}
