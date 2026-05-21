"use client";

import { useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Package, X, Loader2, Pencil, Trash2, FolderPlus } from "lucide-react";
import { createProduct, updateProduct, deleteProduct, createCategory } from "@/actions";
import { PageHeader } from "@/components/ui/page-header";
import { ConfirmModal } from "@/components/ui/confirm-modal";
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
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ productName: "", category: "", categoryId: "", supplierName: "", supplierId: "", unitPrice: "", quantity: "", minThreshold: "" });
  const defaultForm = { productName: "", category: "", categoryId: "", supplierName: "", supplierId: "", unitPrice: "", quantity: "", minThreshold: "" };
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [catName, setCatName] = useState("");
  const [catParent, setCatParent] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);

  const filtered = initialProducts.filter((p) => {
    if (search && !p.productName.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCategory && p.categoryId !== Number(filterCategory)) return false;
    if (filterSupplier && p.supplierId !== Number(filterSupplier)) return false;
    if (filterStatus === "low" && (p.quantity > p.minThreshold || p.quantity === 0)) return false;
    if (filterStatus === "out" && p.quantity !== 0) return false;
    return true;
  });

  function statusBadge(product: Product) {
    if (product.quantity === 0) return { label: "OUT OF STOCK", className: "bg-rose-50 text-rose-700 border border-rose-200" };
    if (product.quantity <= product.minThreshold) return { label: "LOW STOCK", className: "bg-amber-50 text-amber-700 border border-amber-200" };
    return { label: "IN STOCK", className: "bg-emerald-50 text-emerald-700 border border-emerald-200" };
  }

  function renderCategoryOptions(cats: typeof categories, depth = 0): ReactNode[] {
    return cats.flatMap((c) => [
      <option key={c.id} value={c.id}>
        {depth > 0 ? `${"—".repeat(depth)} ` : ""}{c.name}
      </option>,
      ...(c.childCategories?.length ? renderCategoryOptions(c.childCategories as any, depth + 1) : []),
    ]);
  }

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!form.productName) return;
    setAdding(true);
    try {
      await createProduct({
        productName: form.productName,
        category: form.category || "Uncategorized",
        categoryId: Number(form.categoryId) || undefined,
        supplierName: form.supplierName || "Unknown",
        supplierId: Number(form.supplierId) || undefined,
        unitPrice: Number(form.unitPrice) || 0,
        quantity: Number(form.quantity) || 0,
        minThreshold: Number(form.minThreshold) || 5,
      });
      setShowAdd(false);
      setForm(defaultForm);
      router.refresh();
    } catch (e) {
      console.error("Failed to add product", e);
    } finally {
      setAdding(false);
    }
  }

  function openEdit(product: Product) {
    setForm({
      productName: product.productName,
      category: product.category,
      categoryId: String(product.categoryId ?? ""),
      supplierName: product.supplierName,
      supplierId: String(product.supplierId ?? ""),
      unitPrice: String(product.unitPrice),
      quantity: String(product.quantity),
      minThreshold: String(product.minThreshold),
    });
    setShowEdit(product.id);
  }

  async function handleEditProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!form.productName || showEdit === null) return;
    setSaving(true);
    try {
      await updateProduct(showEdit, {
        productName: form.productName,
        category: form.category || "Uncategorized",
        categoryId: Number(form.categoryId) || undefined,
        supplierName: form.supplierName || "Unknown",
        supplierId: Number(form.supplierId) || undefined,
        unitPrice: Number(form.unitPrice) || 0,
        minThreshold: Number(form.minThreshold) || 5,
      });
      setShowEdit(null);
      setForm(defaultForm);
      router.refresh();
    } catch (e) {
      console.error("Failed to update product", e);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (deleteTarget === null) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteTarget);
      setDeleteTarget(null);
      router.refresh();
    } catch (e) {
      console.error("Failed to delete product", e);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Inventory Management" subtitle="Manage your product catalog — add, edit, and remove stock items. Track quantities and thresholds for each product." />

      <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search SKU, Name..."
            className="w-full pl-10 pr-4 py-2.5 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10" />
        </div>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="min-w-[160px] px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a]">
          <option value="">All Categories</option>
          {renderCategoryOptions(categories)}
        </select>
        <select value={filterSupplier} onChange={(e) => setFilterSupplier(e.target.value)} className="min-w-[160px] px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a]">
          <option value="">All Suppliers</option>
          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.supplierName}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="min-w-[140px] px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a]">
          <option value="">All Status</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#fd761a] to-[#e56600] text-white text-sm font-semibold rounded-lg shadow-lg shadow-[#fd761a]/20 hover:shadow-xl hover:shadow-[#fd761a]/25 transition-all duration-200 active:scale-[0.98]">
          <Plus className="h-4 w-4" /> Add Product
        </button>
        <button onClick={() => setShowCategoryModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 border border-[#e2e8f0] text-sm font-medium rounded-lg text-[#64748b] hover:bg-white hover:shadow-sm transition-all">
          <FolderPlus className="h-4 w-4" /> Category
        </button>
      </div>

      <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                <th className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Product Name</th>
                <th className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Category</th>
                <th className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Supplier</th>
                <th className="text-right p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Price</th>
                <th className="text-right p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Qty</th>
                <th className="text-right p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Min Thr.</th>
                <th className="text-center p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Status</th>
                <th className="text-center p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {filtered.map((product, i) => {
                const badge = statusBadge(product);
                return (
                  <tr key={product.id} className={`${i % 2 === 0 ? "" : "bg-[#fafbfc]"} hover:bg-[#f1f5f9] transition-colors`}>
                    <td className="p-4 font-medium text-[#0e212c]">{product.productName}</td>
                    <td className="p-4 text-[#64748b]">{product.category}</td>
                    <td className="p-4 text-[#64748b]">{product.supplierName}</td>
                    <td className="p-4 text-right font-mono text-[#0e212c]">₱{Number(product.unitPrice).toLocaleString()}</td>
                    <td className={`p-4 text-right font-mono ${product.quantity <= product.minThreshold ? "text-[#fd761a] font-bold" : "text-[#0e212c]"}`}>{product.quantity}</td>
                    <td className="p-4 text-right font-mono text-[#94a3b8]">{product.minThreshold}</td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(product)} className="p-1.5 rounded-md text-[#94a3b8] hover:text-[#fd761a] hover:bg-amber-50 transition-all" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(product.id)} className="p-1.5 rounded-md text-[#94a3b8] hover:text-rose-500 hover:bg-rose-50 transition-all" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="p-8 text-center text-[#94a3b8]">No products found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-[#e2e8f0] p-4 flex items-center justify-between text-sm text-[#64748b]">
          <span>Showing {filtered.length} of {initialProducts.length} items</span>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-xl shadow-2xl border border-[#e2e8f0] w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#e2e8f0]">
              <h2 className="text-lg font-bold text-[#0e212c]">Add Product</h2>
              <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b] transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAddProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">Product Name *</label>
                <input value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} required
                  className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">Category</label>
                  <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value, category: categories.find(c => c.id === Number(e.target.value))?.name || "" })}
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a]">
                    <option value="">Select category</option>
                    {renderCategoryOptions(categories)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">Supplier</label>
                  <select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value, supplierName: suppliers.find(s => s.id === Number(e.target.value))?.supplierName || "" })}
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a]">
                    <option value="">Select supplier</option>
                    {suppliers.filter((s) => s.isAvailable).map((s) => <option key={s.id} value={s.id}>{s.supplierName}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">Unit Price</label>
                  <input type="number" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">Quantity</label>
                  <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">Min Threshold</label>
                  <input type="number" value={form.minThreshold} onChange={(e) => setForm({ ...form, minThreshold: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a]" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)}
                  className="flex-1 py-2.5 border border-[#e2e8f0] text-sm font-medium text-[#64748b] rounded-lg hover:bg-[#f8fafc] transition-all">Cancel</button>
                <button type="submit" disabled={adding}
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#fd761a] to-[#e56600] text-white text-sm font-semibold rounded-lg shadow-lg shadow-[#fd761a]/20 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {adding ? <><Loader2 className="h-4 w-4 animate-spin" /> Adding...</> : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEdit !== null && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center" onClick={() => { setShowEdit(null); setForm(defaultForm); }}>
          <div className="bg-white rounded-xl shadow-2xl border border-[#e2e8f0] w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#e2e8f0]">
              <h2 className="text-lg font-bold text-[#0e212c]">Edit Product</h2>
              <button onClick={() => { setShowEdit(null); setForm(defaultForm); }} className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b] transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleEditProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">Product Name *</label>
                <input value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} required
                  className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">Category</label>
                  <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value, category: categories.find(c => c.id === Number(e.target.value))?.name || "" })}
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a]">
                    <option value="">Select category</option>
                    {renderCategoryOptions(categories)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">Supplier</label>
                  <select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value, supplierName: suppliers.find(s => s.id === Number(e.target.value))?.supplierName || "" })}
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a]">
                    <option value="">Select supplier</option>
                    {suppliers.filter((s) => s.isAvailable).map((s) => <option key={s.id} value={s.id}>{s.supplierName}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">Unit Price</label>
                  <input type="number" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">Quantity</label>
                  <input type="number" value={form.quantity} disabled
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#94a3b8] bg-[#f8fafc] focus:outline-none cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">Min Threshold</label>
                  <input type="number" value={form.minThreshold} onChange={(e) => setForm({ ...form, minThreshold: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a]" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowEdit(null); setForm(defaultForm); }}
                  className="flex-1 py-2.5 border border-[#e2e8f0] text-sm font-medium text-[#64748b] rounded-lg hover:bg-[#f8fafc] transition-all">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#fd761a] to-[#e56600] text-white text-sm font-semibold rounded-lg shadow-lg shadow-[#fd761a]/20 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        message="This action cannot be undone. The product will be permanently removed from inventory."
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        variant="danger"
      />

      {/* Create Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center" onClick={() => { setShowCategoryModal(false); setCatName(""); setCatParent(""); }}>
          <div className="bg-white rounded-xl shadow-2xl border border-[#e2e8f0] w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#e2e8f0]">
              <h2 className="text-lg font-bold text-[#0e212c]">Create Category</h2>
              <button onClick={() => { setShowCategoryModal(false); setCatName(""); setCatParent(""); }} className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b] transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">Category Name *</label>
                <input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="e.g. Power Tools"
                  className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">Parent Category (optional)</label>
                <select value={catParent} onChange={(e) => setCatParent(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm bg-white text-[#0e212c] focus:outline-none focus:border-[#fd761a]">
                  <option value="">None (top-level)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}{c.childCategories.length > 0 ? ` (${c.childCategories.length} children)` : ""}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowCategoryModal(false); setCatName(""); setCatParent(""); }}
                  className="flex-1 py-2.5 border border-[#e2e8f0] text-sm font-medium text-[#64748b] rounded-lg hover:bg-[#f8fafc] transition-all">Cancel</button>
                <button onClick={async () => {
                  if (!catName.trim()) return;
                  setAddingCategory(true);
                  try {
                    await createCategory(catName.trim(), catParent ? Number(catParent) : undefined);
                    setShowCategoryModal(false);
                    setCatName("");
                    setCatParent("");
                    router.refresh();
                  } catch (e) {
                    console.error("Failed to create category", e);
                  } finally {
                    setAddingCategory(false);
                  }
                }} disabled={!catName.trim() || addingCategory}
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#fd761a] to-[#e56600] text-white text-sm font-semibold rounded-lg shadow-lg shadow-[#fd761a]/20 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {addingCategory ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</> : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
