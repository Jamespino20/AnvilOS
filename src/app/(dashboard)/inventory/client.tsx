"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Package,
  X,
  Loader2,
  Pencil,
  Trash2,
  ChevronDown,
} from "lucide-react";
import {
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/actions";
import { PageHeader } from "@/components/ui/page-header";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { ExportDialog } from "@/components/export-dialog";
import { CSVImportButton } from "@/components/csv-import";
import type { Product, Category, Supplier } from "@prisma/client";

interface Props {
  products: (Product & {
    categoryRel: Category | null;
    supplierRel: Supplier | null;
  })[];
  categories: (Category & {
    childCategories: Category[];
    _count: { products: number };
  })[];
  suppliers: (Supplier & { _count: { products: number } })[];
}

export function InventoryClient({
  products: initialProducts,
  categories,
  suppliers,
}: Props) {
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
  const [form, setForm] = useState({
    productName: "",
    category: "",
    categoryId: "",
    supplierName: "",
    supplierId: "",
    unitPrice: "",
    quantity: "",
    minThreshold: "",
    imageUrl: "",
  });
  const defaultForm = {
    productName: "",
    category: "",
    categoryId: "",
    supplierName: "",
    supplierId: "",
    unitPrice: "",
    quantity: "",
    minThreshold: "",
    imageUrl: "",
  };


  const filtered = initialProducts.filter((p) => {
    if (search && !p.productName.toLowerCase().includes(search.toLowerCase()))
      return false;
    if (filterCategory && p.categoryId !== Number(filterCategory)) return false;
    if (filterSupplier && p.supplierId !== Number(filterSupplier)) return false;
    if (
      filterStatus === "low" &&
      (p.quantity > p.minThreshold || p.quantity === 0)
    )
      return false;
    if (filterStatus === "out" && p.quantity !== 0) return false;
    return true;
  });

  function statusBadge(product: Product) {
    if (product.quantity === 0)
      return {
        label: "OUT OF STOCK",
        className: "bg-rose-50 text-rose-700 border border-rose-200",
      };
    if (product.quantity <= product.minThreshold)
      return {
        label: "LOW STOCK",
        className: "bg-amber-50 text-amber-700 border border-amber-200",
      };
    return {
      label: "IN STOCK",
      className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    };
  }

  function flatCategoryOptions() {
    return categories.map((c) => (
      <option key={c.id} value={c.id}>
        {c.name}
      </option>
    ));
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
        imageUrl: form.imageUrl || undefined,
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

  function openEdit(product: Product & { imageUrl?: string | null }) {
    setForm({
      productName: product.productName,
      category: product.category,
      categoryId: String(product.categoryId ?? ""),
      supplierName: product.supplierName,
      supplierId: String(product.supplierId ?? ""),
      unitPrice: String(product.unitPrice),
      quantity: String(product.quantity),
      minThreshold: String(product.minThreshold),
      imageUrl: product.imageUrl || "",
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
        imageUrl: form.imageUrl || undefined,
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
      <PageHeader
        title="Inventory Management"
        subtitle="Manage your product catalog — add, edit, and remove stock items. Track quantities and thresholds for each product."
      />

      <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative w-full lg:flex-1 min-w-0 sm:min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search SKU, Name..."
            className="w-full pl-10 pr-4 py-2.5 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10"
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full lg:w-auto">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a]"
          >
            <option value="">All Categories</option>
            {flatCategoryOptions()}
          </select>
          <select
            value={filterSupplier}
            onChange={(e) => setFilterSupplier(e.target.value)}
            className="px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a]"
          >
            <option value="">All Suppliers</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.supplierName}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="col-span-2 sm:col-span-1 px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a]"
          >
            <option value="">All Status</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>
        <div className="flex gap-2 w-full lg:w-auto flex-wrap">
          <button
            onClick={() => setShowAdd(true)}
            title="Add a new product"
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#fd761a] to-[#e56600] text-white text-sm font-semibold rounded-lg shadow-lg shadow-[#fd761a]/20 hover:shadow-xl transition-all duration-200 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" /> <span className="sm:inline">Add Product</span>
          </button>
          <ExportDialog
            filename={`anvilos-inventory-${new Date().toISOString().slice(0, 10)}.csv`}
            allColumns={[
              { key: "productName", label: "Product Name" },
              { key: "category", label: "Category" },
              { key: "supplierName", label: "Supplier" },
              { key: "unitPrice", label: "Unit Price" },
              { key: "quantity", label: "Quantity" },
              { key: "minThreshold", label: "Min Threshold" },
              { key: "isAvailable", label: "Status" },
            ]}
            fetchRows={async (selectedColumns) => filtered.map((p) =>
              selectedColumns.map((key) => {
                if (key === "productName") return p.productName;
                if (key === "category") return p.category;
                if (key === "supplierName") return p.supplierName;
                if (key === "unitPrice") return `₱${Number(p.unitPrice).toLocaleString()}`;
                if (key === "quantity") return String(p.quantity);
                if (key === "minThreshold") return String(p.minThreshold);
                if (key === "isAvailable") return p.quantity === 0 ? "Out of Stock" : p.quantity <= p.minThreshold ? "Low Stock" : "In Stock";
                return "";
              })
            )}
            label="Export"
            title="Export inventory"
          />
          <CSVImportButton table="inventory" onImported={() => window.location.reload()} title="Import products from CSV" />
        </div>
      </div>

      <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden relative group">
        <div className="absolute top-1/2 right-4 -translate-y-1/2 px-2 py-4 bg-white/80 border border-[#e2e8f0] rounded-l-lg shadow-sm z-10 lg:hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold text-[#64748b] uppercase vertical-text">Scroll</span>
            <ChevronDown className="h-3 w-3 text-[#fd761a] -rotate-90" />
          </div>
        </div>
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-sm min-w-[1000px] lg:min-w-0">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                <th className="p-4 w-12"></th>
                <th className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                  Product Name
                </th>
                <th className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                  Category
                </th>
                <th className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                  Supplier
                </th>
                <th className="text-right p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                  Price
                </th>
                <th className="text-right p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                  Qty
                </th>
                <th className="text-right p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                  Min Thr.
                </th>
                <th className="text-center p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                  Status
                </th>
                <th className="text-center p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {filtered.map((product, i) => {
                const badge = statusBadge(product);
                const imgUrl = (product as any).imageUrl;
                return (
                  <tr
                    key={product.id}
                    className={`${i % 2 === 0 ? "" : "bg-[#fafbfc]"} hover:bg-[#f1f5f9] transition-colors`}
                  >
                    <td className="p-2 pl-4">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover border border-[#e2e8f0]"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-center">
                          <Package className="h-4 w-4 text-[#94a3b8]" />
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-medium text-[#0e212c]">
                      {product.productName}
                    </td>
                    <td className="p-4 text-[#64748b]">{product.category}</td>
                    <td className="p-4 text-[#64748b]">
                      {product.supplierName}
                    </td>
                    <td className="p-4 text-right font-mono text-[#0e212c]">
                      ₱{Number(product.unitPrice).toLocaleString()}
                    </td>
                    <td
                      className={`p-4 text-right font-mono ${product.quantity <= product.minThreshold ? "text-[#fd761a] font-bold" : "text-[#0e212c]"}`}
                    >
                      {product.quantity}
                    </td>
                    <td className="p-4 text-right font-mono text-[#94a3b8]">
                      {product.minThreshold}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEdit(product)}
                          className="p-1.5 rounded-md text-[#94a3b8] hover:text-[#fd761a] hover:bg-amber-50 transition-all"
                          title="Edit product details"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(product.id)}
                          className="p-1.5 rounded-md text-[#94a3b8] hover:text-rose-500 hover:bg-rose-50 transition-all"
                          title="Delete product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-[#94a3b8]">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-[#e2e8f0] p-4 flex items-center justify-between text-sm text-[#64748b]">
          <span>
            Showing {filtered.length} of {initialProducts.length} items
          </span>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAdd && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setShowAdd(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl border border-[#e2e8f0] w-full max-w-lg mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#e2e8f0]">
              <h2 className="text-lg font-bold text-[#0e212c]">Add Product</h2>
              <button
                onClick={() => setShowAdd(false)}
                className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                  Product Name *
                </label>
                <input
                  value={form.productName}
                  onChange={(e) =>
                    setForm({ ...form, productName: e.target.value })
                  }
                  required
                  className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    value={form.categoryId}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        categoryId: e.target.value,
                        category:
                          categories.find(
                            (c) => c.id === Number(e.target.value),
                          )?.name || "",
                      })
                    }
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a]"
                  >
                    <option value="">Select category</option>
                    {flatCategoryOptions()}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                    Supplier
                  </label>
                  <select
                    value={form.supplierId}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        supplierId: e.target.value,
                        supplierName:
                          suppliers.find((s) => s.id === Number(e.target.value))
                            ?.supplierName || "",
                      })
                    }
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a]"
                  >
                    <option value="">Select supplier</option>
                    {suppliers
                      .filter((s) => s.isAvailable)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.supplierName}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                    Unit Price
                  </label>
                  <input
                    type="number"
                    value={form.unitPrice}
                    onChange={(e) =>
                      setForm({ ...form, unitPrice: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={form.quantity}
                    onChange={(e) =>
                      setForm({ ...form, quantity: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                    Min Threshold
                  </label>
                  <input
                    type="number"
                    value={form.minThreshold}
                    onChange={(e) =>
                      setForm({ ...form, minThreshold: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                  Product Photo
                </label>
                <div className="flex items-center gap-3">
                  {form.imageUrl ? (
                    <img src={form.imageUrl} alt="Preview" className="w-14 h-14 rounded-lg object-cover border border-[#e2e8f0] shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-center shrink-0">
                      <Package className="h-5 w-5 text-[#94a3b8]" />
                    </div>
                  )}
                  <label className="flex-1 cursor-pointer">
                    <input type="file" accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => setForm({ ...form, imageUrl: ev.target?.result as string });
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden" />
                    <div className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#64748b] bg-white hover:bg-[#f8fafc] transition-colors text-center">
                      {form.imageUrl ? "Change Photo" : "Choose File"}
                    </div>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 py-2.5 border border-[#e2e8f0] text-sm font-medium text-[#64748b] rounded-lg hover:bg-[#f8fafc] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#fd761a] to-[#e56600] text-white text-sm font-semibold rounded-lg shadow-lg shadow-[#fd761a]/20 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {adding ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Adding...
                    </>
                  ) : (
                    "Add Product"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEdit !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center"
          onClick={() => {
            setShowEdit(null);
            setForm(defaultForm);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl border border-[#e2e8f0] w-full max-w-lg mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#e2e8f0]">
              <h2 className="text-lg font-bold text-[#0e212c]">Edit Product</h2>
              <button
                onClick={() => {
                  setShowEdit(null);
                  setForm(defaultForm);
                }}
                className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEditProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                  Product Name *
                </label>
                <input
                  value={form.productName}
                  onChange={(e) =>
                    setForm({ ...form, productName: e.target.value })
                  }
                  required
                  className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    value={form.categoryId}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        categoryId: e.target.value,
                        category:
                          categories.find(
                            (c) => c.id === Number(e.target.value),
                          )?.name || "",
                      })
                    }
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a]"
                  >
                    <option value="">Select category</option>
                    {flatCategoryOptions()}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                    Supplier
                  </label>
                  <select
                    value={form.supplierId}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        supplierId: e.target.value,
                        supplierName:
                          suppliers.find((s) => s.id === Number(e.target.value))
                            ?.supplierName || "",
                      })
                    }
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a]"
                  >
                    <option value="">Select supplier</option>
                    {suppliers
                      .filter((s) => s.isAvailable)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.supplierName}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                    Unit Price
                  </label>
                  <input
                    type="number"
                    value={form.unitPrice}
                    onChange={(e) =>
                      setForm({ ...form, unitPrice: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={form.quantity}
                    disabled
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#94a3b8] bg-[#f8fafc] focus:outline-none cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                    Min Threshold
                  </label>
                  <input
                    type="number"
                    value={form.minThreshold}
                    onChange={(e) =>
                      setForm({ ...form, minThreshold: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                  Product Photo
                </label>
                <div className="flex items-center gap-3">
                  {form.imageUrl ? (
                    <img src={form.imageUrl} alt="Preview" className="w-14 h-14 rounded-lg object-cover border border-[#e2e8f0] shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-center shrink-0">
                      <Package className="h-5 w-5 text-[#94a3b8]" />
                    </div>
                  )}
                  <label className="flex-1 cursor-pointer">
                    <input type="file" accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => setForm({ ...form, imageUrl: ev.target?.result as string });
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden" />
                    <div className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#64748b] bg-white hover:bg-[#f8fafc] transition-colors text-center">
                      {form.imageUrl ? "Change Photo" : "Choose File"}
                    </div>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEdit(null);
                    setForm(defaultForm);
                  }}
                  className="flex-1 py-2.5 border border-[#e2e8f0] text-sm font-medium text-[#64748b] rounded-lg hover:bg-[#f8fafc] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#fd761a] to-[#e56600] text-white text-sm font-semibold rounded-lg shadow-lg shadow-[#fd761a]/20 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
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


    </div>
  );
}
