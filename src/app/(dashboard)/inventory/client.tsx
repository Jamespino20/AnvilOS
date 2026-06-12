"use client";

import { useState, useRef, useEffect } from "react";
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
  ChevronLeft,
  ChevronRight,
  Check,
  MoreVertical,
  Zap,
  Weight,
  Box,
} from "lucide-react";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
} from "@/actions";
import { PageHeader } from "@/components/ui/page-header";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { ExportDialog } from "@/components/export-dialog";
import { ImportButton } from "@/components/import-button";
import type { Product, Category, Supplier, Brand } from "@prisma/client";
import { toast } from "sonner";
import { formatMoney, formatReportMoney } from "@/lib/format";

interface Props {
  products: (Product & {
    categoryRel: Category | null;
    supplierRel: Supplier | null;
    brandRel: Brand | null;
  })[];
  categories: (Category & {
    _count: { products: number };
  })[];
  suppliers: (Supplier & { _count: { products: number } })[];
  brands: (Brand & { _count: { products: number } })[];
  role?: string | null;
}

export function InventoryClient({
  products: initialProducts,
  categories,
  suppliers,
  brands,
  role,
}: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSubCategory, setFilterSubCategory] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortBy, setSortBy] = useState<string>("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
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
    parentCategoryId: "",
    supplierName: "",
    supplierId: "",
    brandId: "",
    sellingPrice: "",
    costPrice: "",
    quantity: "",
    minThreshold: "",
    imageUrl: "",
    isFastMoving: false,
    sellByWeight: false,
    sellByBox: false,
    boxQuantity: "",
  });
  const defaultForm = {
    productName: "",
    category: "",
    categoryId: "",
    parentCategoryId: "",
    supplierName: "",
    supplierId: "",
    brandId: "",
    sellingPrice: "",
    costPrice: "",
    quantity: "",
    minThreshold: "",
    imageUrl: "",
    isFastMoving: false,
    sellByWeight: false,
    sellByBox: false,
    boxQuantity: "",
  };

  const [page, setPage] = useState(1);
  const perPage = 15;
  const isAdmin = role === "ADMIN" || role === "SUPERADMIN";

  // Inline quantity editing
  const [editQtyId, setEditQtyId] = useState<number | null>(null);
  const [editQtyVal, setEditQtyVal] = useState("");
  const [savingQty, setSavingQty] = useState(false);
  const editQtyRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editQtyId !== null && editQtyRef.current) {
      editQtyRef.current.focus();
      editQtyRef.current.select();
    }
  }, [editQtyId]);

  const parentCategoryList = categories.filter((c) => c.parentCategoryId === null);
  const childCategoryList = categories.filter((c) => c.parentCategoryId === Number(filterCategory));
  const formChildCategoryList = categories.filter((c) => c.parentCategoryId === Number(form.parentCategoryId));

  async function handleSaveQty(productId: number) {
    const val = parseInt(editQtyVal, 10);
    if (isNaN(val) || val < 0) { setEditQtyId(null); return; }
    setSavingQty(true);
    try {
      await adjustStock(productId, val);
      router.refresh();
      toast.success("Quantity updated");
    } catch (e) {
      toast.error("Failed to update quantity");
    } finally {
      setSavingQty(false);
      setEditQtyId(null);
    }
  }


  const filtered = initialProducts.filter((p) => {
    if (search && !p.productName.toLowerCase().includes(search.toLowerCase()))
      return false;
    if (filterSubCategory && p.categoryId !== Number(filterSubCategory)) return false;
    else if (filterCategory && p.categoryId !== Number(filterCategory)) {
      const childIds = childCategoryList.map((c) => c.id);
      if (!childIds.includes(p.categoryId ?? -1) && p.categoryId !== Number(filterCategory)) return false;
    }
    if (filterSupplier && p.supplierId !== Number(filterSupplier)) return false;
    if (
      filterStatus === "low" &&
      (p.quantity > p.minThreshold || p.quantity === 0)
    )
      return false;
    if (filterStatus === "out" && p.quantity !== 0) return false;
    if (filterStatus === "fast" && !p.isFastMoving) return false;
    if (filterStatus === "weight" && !p.sellByWeight) return false;
    if (filterStatus === "box" && !p.sellByBox) return false;
    return true;
  }).sort((a, b) => {
    if (!sortBy) return 0;
    const dir = sortDir === "asc" ? 1 : -1;
    switch (sortBy) {
      case "productName": return a.productName.localeCompare(b.productName) * dir;
      case "category": return (a.category || "").localeCompare(b.category || "") * dir;
      case "supplier": return (a.supplierName || "").localeCompare(b.supplierName || "") * dir;
      case "brand": return ((a as any).brandRel?.name || "").localeCompare((b as any).brandRel?.name || "") * dir;
      case "sellingPrice": return (Number(a.sellingPrice) - Number(b.sellingPrice)) * dir;
      case "costPrice": return (Number(a.unitPrice || 0) - Number(b.unitPrice || 0)) * dir;
      case "quantity": return (a.quantity - b.quantity) * dir;
      default: return 0;
    }
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  function renderPageNumbers() {
    const pages: React.ReactNode[] = [];
    const maxVisible = 7;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(
          <button key={i} onClick={() => setPage(i)}
            className={`min-w-[28px] h-7 text-xs font-semibold rounded-md transition-all ${i === page ? "bg-[#fd761a] text-white shadow-sm" : "text-[#64748b] hover:bg-[#f1f5f9]"}`}>
            {i}
          </button>
        );
      }
    } else {
      let start = Math.max(1, page - 3);
      let end = Math.min(totalPages, page + 3);
      if (start > 1) {
        pages.push(<span key="start-ellipsis" className="px-1 text-[#94a3b8] text-xs">...</span>);
      }
      for (let i = start; i <= end; i++) {
        pages.push(
          <button key={i} onClick={() => setPage(i)}
            className={`min-w-[28px] h-7 text-xs font-semibold rounded-md transition-all ${i === page ? "bg-[#fd761a] text-white shadow-sm" : "text-[#64748b] hover:bg-[#f1f5f9]"}`}>
            {i}
          </button>
        );
      }
      if (end < totalPages) {
        pages.push(<span key="end-ellipsis" className="px-1 text-[#94a3b8] text-xs">...</span>);
      }
    }
    return pages;
  }

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
    const selectedCategoryId = Number(form.categoryId) || Number(form.parentCategoryId) || 0;
    const selectedCategoryName = form.category || parentCategoryList.find((c) => c.id === Number(form.parentCategoryId))?.name || "Uncategorized";
    try {
      await createProduct({
        productName: form.productName,
        category: selectedCategoryName,
        categoryId: selectedCategoryId || undefined,
        supplierName: form.supplierName || "Unknown",
        supplierId: Number(form.supplierId) || undefined,
        brandId: Number(form.brandId) || undefined,
        unitPrice: Number(form.costPrice) || undefined,
        sellingPrice: Number(form.sellingPrice) || 0,
        quantity: Number(form.quantity) || 0,
        minThreshold: Number(form.minThreshold) || 5,
        imageUrl: form.imageUrl || undefined,
        isFastMoving: form.isFastMoving,
        sellByWeight: form.sellByWeight,
        sellByBox: form.sellByBox,
        boxQuantity: form.sellByBox ? Number(form.boxQuantity) || undefined : undefined,
      });
      setShowAdd(false);
      setForm(defaultForm);
      router.refresh();
      toast.success("Product added successfully");
    } catch (e) {
      console.error("Failed to add product", e);
      toast.error("Failed to add product");
    } finally {
      setAdding(false);
    }
  }

  function openEdit(product: Product & { imageUrl?: string | null }) {
    const catParent = categories.find((c) => c.id === (product.categoryId ?? -1))?.parentCategoryId;
    setForm({
      productName: product.productName,
      category: product.category,
      categoryId: String(product.categoryId ?? ""),
      parentCategoryId: catParent ? String(catParent) : "",
      supplierName: product.supplierName,
      supplierId: String(product.supplierId ?? ""),
      brandId: String((product as any).brandId ?? ""),
      sellingPrice: String(product.sellingPrice),
      costPrice: String(product.unitPrice ?? ""),
      quantity: String(product.quantity),
      minThreshold: String(product.minThreshold),
      imageUrl: product.imageUrl || "",
      isFastMoving: product.isFastMoving,
      sellByWeight: product.sellByWeight,
      sellByBox: product.sellByBox,
      boxQuantity: String(product.boxQuantity ?? ""),
    });
    setShowEdit(product.id);
  }

  async function handleEditProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!form.productName || showEdit === null) return;
    setSaving(true);
    const selectedCategoryId = Number(form.categoryId) || Number(form.parentCategoryId) || 0;
    const selectedCategoryName = form.category || parentCategoryList.find((c) => c.id === Number(form.parentCategoryId))?.name || "Uncategorized";
    try {
      await updateProduct(showEdit, {
        productName: form.productName,
        category: selectedCategoryName,
        categoryId: selectedCategoryId || undefined,
        supplierName: form.supplierName || "Unknown",
        supplierId: Number(form.supplierId) || undefined,
        brandId: Number(form.brandId) || undefined,
        unitPrice: Number(form.costPrice) || undefined,
        sellingPrice: Number(form.sellingPrice) || undefined,
        minThreshold: Number(form.minThreshold) || 5,
        imageUrl: form.imageUrl || undefined,
        isFastMoving: form.isFastMoving,
        sellByWeight: form.sellByWeight,
        sellByBox: form.sellByBox,
        boxQuantity: form.sellByBox ? Number(form.boxQuantity) || undefined : undefined,
      });
      setShowEdit(null);
      setForm(defaultForm);
      router.refresh();
      toast.success("Product updated successfully");
    } catch (e) {
      console.error("Failed to update product", e);
      toast.error("Failed to update product");
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
      toast.success("Product deleted successfully");
    } catch (e) {
      console.error("Failed to delete product", e);
      toast.error("Failed to delete product");
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

      <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 flex flex-col lg:flex-row gap-3 items-center">
        <div className="relative w-full lg:flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search SKU, Name..."
            className="w-full h-10 pl-10 pr-4 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10"
          />
        </div>
        <div className="flex gap-2 w-full lg:w-auto">
          <select
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); setFilterSubCategory(""); setPage(1); }}
            className="h-10 px-3 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a] w-full lg:w-auto min-w-0"
          >
            <option value="">All Categories</option>
            {parentCategoryList.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={filterSubCategory}
            onChange={(e) => { setFilterSubCategory(e.target.value); setPage(1); }}
            disabled={filterCategory === "" || childCategoryList.length === 0}
            className="h-10 px-3 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a] w-full lg:w-auto min-w-0 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <option value="">{filterCategory === "" ? "Select parent first" : childCategoryList.length === 0 ? "No subcategories" : "All Subcategories"}</option>
            {childCategoryList.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={filterSupplier}
            onChange={(e) => { setFilterSupplier(e.target.value); setPage(1); }}
            className="h-10 px-3 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a] w-full lg:w-auto min-w-0"
          >
            <option value="">Supplier</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.supplierName}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="h-10 px-3 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a] w-full lg:w-auto min-w-0"
          >
            <option value="">Status</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
            <option value="fast">Fast Moving</option>
            <option value="weight">Sell by Weight</option>
            <option value="box">Sell by Box</option>
          </select>
        </div>
        <div className="flex gap-2 w-full lg:w-auto">
          <ExportDialog
            filename={`cwl-hardware-inventory-${new Date().toISOString().slice(0, 10)}.csv`}
            allColumns={[
              { key: "productName", label: "Product Name" },
              { key: "category", label: "Category" },
              { key: "supplierName", label: "Supplier" },
              { key: "brandName", label: "Brand" },
              { key: "sellingPrice", label: "Selling Price" },
              { key: "costPrice", label: "Unit Price" },
              { key: "quantity", label: "Quantity" },
              { key: "minThreshold", label: "Min Threshold" },
              { key: "isFastMoving", label: "Fast Moving" },
              { key: "sellByWeight", label: "Sell by Weight" },
              { key: "sellByBox", label: "Sell by Box" },
              { key: "boxQuantity", label: "Box Qty" },
              { key: "isAvailable", label: "Status" },
            ]}
            fetchRows={async (selectedColumns) => filtered.map((p) =>
              selectedColumns.map((key) => {
                if (key === "productName") return p.productName;
                if (key === "category") return p.category;
                if (key === "supplierName") return p.supplierName;
                if (key === "brandName") return (p as any).brandRel?.name || "";
                if (key === "sellingPrice") return formatReportMoney(p.sellingPrice);
                if (key === "costPrice") return p.unitPrice ? formatReportMoney(p.unitPrice) : "";
                if (key === "quantity") return String(p.quantity);
                if (key === "minThreshold") return String(p.minThreshold);
                if (key === "isFastMoving") return p.isFastMoving ? "Yes" : "No";
                if (key === "sellByWeight") return p.sellByWeight ? "Yes" : "No";
                if (key === "sellByBox") return p.sellByBox ? "Yes" : "No";
                if (key === "boxQuantity") return p.boxQuantity ? String(p.boxQuantity) : "";
                if (key === "isAvailable") return p.quantity === 0 ? "Out of Stock" : p.quantity <= p.minThreshold ? "Low Stock" : "In Stock";
                return "";
              })
            )}
            label="Export"
            title="Export inventory"
          />
          {isAdmin && <ImportButton table="inventory" onImported={() => window.location.reload()} title="Import products from CSV or XLSX" />}
          {isAdmin && (
            <button
              onClick={() => setShowAdd(true)}
              title="Add a new product"
              className="h-10 flex items-center justify-center gap-2 px-5 bg-gradient-to-r from-[#fd761a] to-[#e56600] text-white text-sm font-semibold rounded-lg shadow-lg shadow-[#fd761a]/20 hover:shadow-xl transition-all duration-200 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" /> Add Product
            </button>
          )}
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
                <th
                  className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider cursor-pointer select-none hover:text-[#fd761a] transition-colors"
                  onClick={() => { if (sortBy === "productName") setSortDir(sortDir === "asc" ? "desc" : "asc"); else { setSortBy("productName"); setSortDir("asc"); } }}
                >
                  Product Name
                  <span className={`ml-1 ${sortBy === "productName" ? "text-[#fd761a]" : "text-[#cbd5e1]"}`}>
                    {sortBy === "productName" && sortDir === "desc" ? "\u25BC" : "\u25B2"}
                  </span>
                </th>
                <th
                  className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider cursor-pointer select-none hover:text-[#fd761a] transition-colors"
                  onClick={() => { if (sortBy === "category") setSortDir(sortDir === "asc" ? "desc" : "asc"); else { setSortBy("category"); setSortDir("asc"); } }}
                >
                  Category
                  <span className={`ml-1 ${sortBy === "category" ? "text-[#fd761a]" : "text-[#cbd5e1]"}`}>
                    {sortBy === "category" && sortDir === "desc" ? "\u25BC" : "\u25B2"}
                  </span>
                </th>
                <th
                  className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider cursor-pointer select-none hover:text-[#fd761a] transition-colors"
                  onClick={() => { if (sortBy === "supplier") setSortDir(sortDir === "asc" ? "desc" : "asc"); else { setSortBy("supplier"); setSortDir("asc"); } }}
                >
                  Supplier
                  <span className={`ml-1 ${sortBy === "supplier" ? "text-[#fd761a]" : "text-[#cbd5e1]"}`}>
                    {sortBy === "supplier" && sortDir === "desc" ? "\u25BC" : "\u25B2"}
                  </span>
                </th>
                <th
                  className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider cursor-pointer select-none hover:text-[#fd761a] transition-colors"
                  onClick={() => { if (sortBy === "brand") setSortDir(sortDir === "asc" ? "desc" : "asc"); else { setSortBy("brand"); setSortDir("asc"); } }}
                >
                  Brand
                  <span className={`ml-1 ${sortBy === "brand" ? "text-[#fd761a]" : "text-[#cbd5e1]"}`}>
                    {sortBy === "brand" && sortDir === "desc" ? "\u25BC" : "\u25B2"}
                  </span>
                </th>
                <th className="text-right p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                  Selling Price
                </th>
                <th className="text-right p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                  Unit Price
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
                <th className="text-right p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                  Last Restocked
                </th>
                {isAdmin && (
                  <th className="text-center p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider w-24">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {paginated.map((product, i) => {
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
                      <div className="flex items-center gap-2">
                        {product.productName}
                        <div className="flex gap-1">
                          {product.isFastMoving && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Zap className="h-2.5 w-2.5" /> Fast
                            </span>
                          )}
                          {product.sellByWeight && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              <Weight className="h-2.5 w-2.5" /> Weight
                            </span>
                          )}
                          {product.sellByBox && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              <Box className="h-2.5 w-2.5" /> Box
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-[#64748b]">{product.category}</td>
                    <td className="p-4 text-[#64748b]">
                      {product.supplierName}
                    </td>
                    <td className="p-4 text-[#64748b]">
                      {(product as any).brandRel?.name || "—"}
                    </td>
                    <td className="p-4 text-right font-mono text-[#0e212c]">
                      {formatMoney(product.sellingPrice)}
                    </td>
                    <td className="p-4 text-right font-mono text-[#94a3b8]">
                      {product.unitPrice ? formatMoney(product.unitPrice) : "\u2014"}
                    </td>
                    <td
                      className={`p-4 text-right font-mono ${product.quantity <= product.minThreshold ? "text-[#fd761a] font-bold" : "text-[#0e212c]"}`}
                    >
                      {isAdmin && editQtyId === product.id ? (
                        <span className="inline-flex items-center gap-1">
                          <input ref={editQtyRef} type="number" min={0} value={editQtyVal}
                            onChange={(e) => setEditQtyVal(e.target.value)}
                            onBlur={() => handleSaveQty(product.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveQty(product.id);
                              if (e.key === "Escape") setEditQtyId(null);
                            }}
                            className="w-16 h-8 px-2 text-right text-xs font-mono border border-[#fd761a] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fd761a]/20" />
                          {savingQty && <Loader2 className="h-3 w-3 animate-spin text-[#64748b]" />}
                        </span>
                      ) : isAdmin ? (
                        <button onClick={() => { setEditQtyId(product.id); setEditQtyVal(String(product.quantity)); }}
                          className="cursor-pointer hover:bg-[#f1f5f9] px-2 py-1 -ml-2 rounded transition-colors text-right font-mono w-full"
                          title="Click to edit quantity">
                          {product.quantity}
                        </button>
                      ) : product.quantity}
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
                    <td className="p-4 text-right text-xs font-mono text-[#94a3b8]">
                      {product.lastRestockedAt ? new Date(product.lastRestockedAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "\u2014"}
                    </td>
                    {isAdmin && <td className="p-4 text-center relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === product.id ? null : product.id); }}
                        className="p-1.5 rounded-md text-[#94a3b8] hover:text-[#0e212c] hover:bg-[#f1f5f9] transition-all"
                        title="Actions"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {menuOpen === product.id && (
                        <div className="absolute right-4 top-full mt-1 w-36 bg-white border border-[#e2e8f0] rounded-lg shadow-xl z-30 py-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); openEdit(product); setMenuOpen(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#0e212c] hover:bg-[#f1f5f9] transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5 text-[#64748b]" /> Edit
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteTarget(product.id); setMenuOpen(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </div>
                      )}
                    </td>}
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 12 : 11} className="p-8 text-center text-[#94a3b8]">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-[#e2e8f0] p-4 flex items-center justify-between text-sm text-[#64748b]">
          <span>
            Showing {paginated.length} of {filtered.length} items
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-md text-[#64748b] hover:bg-[#f1f5f9] disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                <ChevronLeft className="h-4 w-4" />
              </button>
              {renderPageNumbers()}
              <button disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-md text-[#64748b] hover:bg-[#f1f5f9] disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      {showAdd && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setShowAdd(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl border border-[#e2e8f0] w-full max-w-lg mx-4 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#e2e8f0] shrink-0">
              <h2 className="text-lg font-bold text-[#0e212c]">Add Product</h2>
              <button
                onClick={() => setShowAdd(false)}
                className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddProduct} className="p-6 space-y-4 flex-1 overflow-y-auto">
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
                    Parent Category
                  </label>
                  <select
                    value={form.parentCategoryId}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        parentCategoryId: e.target.value,
                        categoryId: "",
                        category: "",
                      })
                    }
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a]"
                  >
                    <option value="">Select parent category</option>
                    {parentCategoryList.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                    Subcategory
                  </label>
                  <select
                    value={form.categoryId}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        categoryId: e.target.value,
                        category:
                          formChildCategoryList.find(
                            (c) => c.id === Number(e.target.value),
                          )?.name || "",
                      })
                    }
                    disabled={form.parentCategoryId === "" || formChildCategoryList.length === 0}
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <option value="">{form.parentCategoryId === "" ? "Select parent first" : formChildCategoryList.length === 0 ? "No subcategories" : "Select subcategory"}</option>
                    {formChildCategoryList.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                    Brand
                  </label>
                  <select
                    value={form.brandId}
                    onChange={(e) =>
                      setForm({ ...form, brandId: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a]"
                  >
                    <option value="">Select brand</option>
                    {brands
                      .filter((b) => b.isAvailable)
                      .map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                    Selling Price *
                  </label>
                  <input
                    type="number"
                    value={form.sellingPrice}
                    onChange={(e) =>
                      setForm({ ...form, sellingPrice: e.target.value })
                    }
                    required
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                    Unit Price
                  </label>
                  <input
                    type="number"
                    value={form.costPrice}
                    onChange={(e) =>
                      setForm({ ...form, costPrice: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
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
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                    Fast Moving
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer mt-1.5">
                    <input type="checkbox" checked={form.isFastMoving} onChange={(e) => setForm({ ...form, isFastMoving: e.target.checked })}
                      className="sr-only peer" />
                    <div className="w-10 h-5 bg-[#e2e8f0] rounded-full peer peer-checked:bg-[#fd761a] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                  </label>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                    Sell by Weight
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer mt-1.5">
                    <input type="checkbox" checked={form.sellByWeight} onChange={(e) => { setForm({ ...form, sellByWeight: e.target.checked, ...(e.target.checked ? { sellByBox: false } : {}) }); }}
                      className="sr-only peer" />
                    <div className="w-10 h-5 bg-[#e2e8f0] rounded-full peer peer-checked:bg-[#fd761a] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                  </label>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                    Sell by Box
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer mt-1.5">
                    <input type="checkbox" checked={form.sellByBox} onChange={(e) => { setForm({ ...form, sellByBox: e.target.checked, ...(e.target.checked ? { sellByWeight: false } : {}) }); }}
                      className="sr-only peer" />
                    <div className="w-10 h-5 bg-[#e2e8f0] rounded-full peer peer-checked:bg-[#fd761a] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                  </label>
                </div>
                {form.sellByBox && (
                  <div>
                    <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                      Qty per Box
                    </label>
                    <input
                      type="number"
                      value={form.boxQuantity}
                      onChange={(e) =>
                        setForm({ ...form, boxQuantity: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a]"
                    />
                  </div>
                )}
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
            className="bg-white rounded-xl shadow-2xl border border-[#e2e8f0] w-full max-w-lg mx-4 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#e2e8f0] shrink-0">
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
            <form onSubmit={handleEditProduct} className="p-6 space-y-4 flex-1 overflow-y-auto">
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
                    Parent Category
                  </label>
                  <select
                    value={form.parentCategoryId}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        parentCategoryId: e.target.value,
                        categoryId: "",
                        category: "",
                      })
                    }
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a]"
                  >
                    <option value="">Select parent category</option>
                    {parentCategoryList.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                    Subcategory
                  </label>
                  <select
                    value={form.categoryId}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        categoryId: e.target.value,
                        category:
                          formChildCategoryList.find(
                            (c) => c.id === Number(e.target.value),
                          )?.name || "",
                      })
                    }
                    disabled={form.parentCategoryId === "" || formChildCategoryList.length === 0}
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <option value="">{form.parentCategoryId === "" ? "Select parent first" : formChildCategoryList.length === 0 ? "No subcategories" : "Select subcategory"}</option>
                    {formChildCategoryList.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                    Brand
                  </label>
                  <select
                    value={form.brandId}
                    onChange={(e) =>
                      setForm({ ...form, brandId: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a]"
                  >
                    <option value="">Select brand</option>
                    {brands
                      .filter((b) => b.isAvailable)
                      .map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                    Selling Price
                  </label>
                  <input
                    type="number"
                    value={form.sellingPrice}
                    onChange={(e) =>
                      setForm({ ...form, sellingPrice: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                    Unit Price
                  </label>
                  <input
                    type="number"
                    value={form.costPrice}
                    onChange={(e) =>
                      setForm({ ...form, costPrice: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
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
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                    Fast Moving
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer mt-1.5">
                    <input type="checkbox" checked={form.isFastMoving} onChange={(e) => setForm({ ...form, isFastMoving: e.target.checked })}
                      className="sr-only peer" />
                    <div className="w-10 h-5 bg-[#e2e8f0] rounded-full peer peer-checked:bg-[#fd761a] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                  </label>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                    Sell by Weight
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer mt-1.5">
                    <input type="checkbox" checked={form.sellByWeight} onChange={(e) => { setForm({ ...form, sellByWeight: e.target.checked, ...(e.target.checked ? { sellByBox: false } : {}) }); }}
                      className="sr-only peer" />
                    <div className="w-10 h-5 bg-[#e2e8f0] rounded-full peer peer-checked:bg-[#fd761a] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                  </label>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                    Sell by Box
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer mt-1.5">
                    <input type="checkbox" checked={form.sellByBox} onChange={(e) => { setForm({ ...form, sellByBox: e.target.checked, ...(e.target.checked ? { sellByWeight: false } : {}) }); }}
                      className="sr-only peer" />
                    <div className="w-10 h-5 bg-[#e2e8f0] rounded-full peer peer-checked:bg-[#fd761a] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                  </label>
                </div>
                {form.sellByBox && (
                  <div>
                    <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                      Qty per Box
                    </label>
                    <input
                      type="number"
                      value={form.boxQuantity}
                      onChange={(e) =>
                        setForm({ ...form, boxQuantity: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a]"
                    />
                  </div>
                )}
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




