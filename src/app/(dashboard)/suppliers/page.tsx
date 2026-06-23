/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: June 13, 2026
*/

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  getSuppliers as fetchSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getProducts as fetchProducts,
} from "@/actions";
import {
  Plus,
  Truck,
  Mail,
  Phone,
  MapPin,
  X,
  Loader2,
  Edit3,
  Save,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Package,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/skeleton";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { ExportDialog } from "@/components/export-dialog";
import type { Supplier, Product } from "@prisma/client";
import { toast } from "sonner";

export default function SuppliersPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin =
    (session?.user as any)?.role === "ADMIN" ||
    (session?.user as any)?.role === "SUPERADMIN";
  const [suppliers, setSuppliers] = useState<
    (Supplier & { _count: { products: number } })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [form, setForm] = useState({
    supplierName: "",
    contactName: "",
    contactNumber: "",
    email: "",
    address: "",
    tin: "",
  });
  const [editForm, setEditForm] = useState({
    supplierName: "",
    contactName: "",
    contactNumber: "",
    email: "",
    address: "",
    tin: "",
  });

  const [productModalSupplier, setProductModalSupplier] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [productModalProducts, setProductModalProducts] = useState<Product[]>(
    [],
  );
  const [productModalLoading, setProductModalLoading] = useState(false);
  const [productModalPage, setProductModalPage] = useState(1);
  const PRODUCT_MODAL_PAGE_SIZE = 8;

  useEffect(() => {
    fetchSuppliers().then((data) => {
      setSuppliers(data as any);
      setLoading(false);
    });
  }, []);

  const filtered = suppliers.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.supplierName.toLowerCase().includes(q) ||
      (s.contactName || "").toLowerCase().includes(q) ||
      (s.email || "").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  function refetch() {
    fetchSuppliers().then((data) => {
      setSuppliers(data as any);
    });
  }

  async function openProductModal(supplier: { id: number; name: string }) {
    setProductModalSupplier(supplier);
    setProductModalPage(1);
    setProductModalLoading(true);
    try {
      const products = await fetchProducts({ supplierId: supplier.id });
      setProductModalProducts(products);
    } catch {
      setProductModalProducts([]);
    } finally {
      setProductModalLoading(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.supplierName) return;
    setAdding(true);
    try {
      const supplier = await createSupplier(form);
      setSuppliers((prev) => [supplier as any, ...prev]);
      setShowAdd(false);
      setForm({
        supplierName: "",
        contactName: "",
        contactNumber: "",
        email: "",
        address: "",
        tin: "",
      });
      router.refresh();
      toast.success("Supplier added successfully");
    } catch (e) {
      console.error("Failed to add supplier", e);
      toast.error("Failed to add supplier");
    } finally {
      setAdding(false);
    }
  }

  function openEdit(s: (typeof suppliers)[number]) {
    setEditId(s.id);
    setEditForm({
      supplierName: s.supplierName,
      contactName: s.contactName || "",
      contactNumber: s.contactNumber || "",
      email: s.email || "",
      address: s.address || "",
      tin: s.tin || "",
    });
  }

  async function handleSaveEdit() {
    if (!editId) return;
    setSaving(true);
    try {
      await updateSupplier(editId, editForm);
      setSuppliers((prev) =>
        prev.map((s) => (s.id === editId ? { ...s, ...editForm } : s)),
      );
      setEditId(null);
      toast.success("Supplier updated successfully");
    } catch (e) {
      console.error("Failed to update supplier", e);
      toast.error("Failed to update supplier");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (deleteTarget === null) return;
    setDeleteLoading(true);
    setDeleteError("");
    try {
      await deleteSupplier(deleteTarget);
      setSuppliers((prev) => prev.filter((s) => s.id !== deleteTarget));
      setDeleteTarget(null);
      router.refresh();
      toast.success("Supplier deleted successfully");
    } catch (e: any) {
      setDeleteError(e.message || "Failed to delete supplier");
      toast.error(e.message || "Failed to delete supplier");
    } finally {
      setDeleteLoading(false);
    }
  }

  function renderPageNumbers() {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("ellipsis");
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages);
    }
    return pages.map((p, i) =>
      p === "ellipsis" ? (
        <span key={`e${i}`} className="px-1 text-[#94a3b8] select-none">
          …
        </span>
      ) : (
        <button
          key={p}
          onClick={() => setPage(p)}
          className={`min-w-[32px] h-8 text-xs font-semibold rounded-lg transition-all ${
            p === page
              ? "bg-[#fd761a] text-white shadow-sm"
              : "text-[#64748b] hover:bg-[#f1f5f9]"
          }`}
        >
          {p}
        </button>
      ),
    );
  }

  if (loading)
    return (
      <div className="space-y-5">
        <PageHeader title="Supplier Management" subtitle="Loading..." />
        <TableSkeleton rows={6} cols={5} />
      </div>
    );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Supplier Management"
        subtitle="Manage your supply chain partners — add, edit, and remove suppliers."
      />

      <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative w-full lg:flex-1 min-w-0 sm:min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search supplier name, contact, email..."
            className="w-full pl-10 pr-4 py-2.5 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10"
          />
        </div>
        <div className="flex gap-2 w-full lg:w-auto flex-wrap">
          <ExportDialog
            filename={`cwl-hardware-suppliers-${new Date().toISOString().slice(0, 10)}.csv`}
            allColumns={[
              { key: "supplierName", label: "Supplier Name" },
              { key: "contactName", label: "Contact Person" },
              { key: "contactNumber", label: "Contact Number" },
              { key: "tin", label: "TIN" },
              { key: "email", label: "Email" },
              { key: "address", label: "Address" },
            ]}
            fetchRows={async (selectedColumns) =>
              suppliers.map((s) =>
                selectedColumns.map((key) => {
                  if (key === "supplierName") return s.supplierName;
                  if (key === "contactName") return s.contactName || "";
                  if (key === "contactNumber") return s.contactNumber || "";
                  if (key === "tin") return s.tin || "";
                  if (key === "email") return s.email || "";
                  if (key === "address") return s.address || "";
                  return "";
                }),
              )
            }
            label="Export"
            title="Export suppliers"
          />
          <button
            onClick={() => setShowAdd(true)}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#fd761a] to-[#e56600] text-white text-sm font-semibold rounded-lg shadow-lg shadow-[#fd761a]/20 hover:shadow-xl transition-all duration-200 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" /> Add Supplier
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                <th className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                  Supplier Name
                </th>
                <th className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                  Contact Person
                </th>
                <th className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                  Phone
                </th>
                <th className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                  TIN
                </th>
                <th className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                  Email
                </th>
                <th className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                  Address
                </th>
                <th className="text-center p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                  Products
                </th>
                <th className="text-center p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {paged.map((s, i) => (
                <tr
                  key={s.id}
                  className={`${i % 2 === 0 ? "" : "bg-[#fafbfc]"} hover:bg-[#f1f5f9] transition-colors`}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#fd761a]/10 to-[#fd761a]/5 flex items-center justify-center">
                        <Truck className="h-4 w-4 text-[#fd761a]" />
                      </div>
                      <span className="font-medium text-[#0e212c]">
                        {s.supplierName}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-[#64748b]">{s.contactName || "—"}</td>
                  <td className="p-4 text-[#64748b]">
                    {s.contactNumber || "—"}
                  </td>
                  <td className="p-4 text-[#64748b]">{s.tin || "—"}</td>
                  <td className="p-4 text-[#64748b]">{s.email || "—"}</td>
                  <td className="p-4 text-[#64748b] max-w-[200px] truncate">
                    {s.address || "—"}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() =>
                        openProductModal({ id: s.id, name: s.supplierName })
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#f1f5f9] text-[#64748b] text-xs font-semibold hover:bg-[#e2e8f0] hover:text-[#0e212c] transition-colors cursor-pointer"
                    >
                      <Package className="h-3 w-3" />
                      Products: {s._count.products}
                    </button>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openEdit(s)}
                        className="p-1.5 rounded-md text-[#94a3b8] hover:text-[#fd761a] hover:bg-amber-50 transition-all"
                        title="Edit supplier details"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      {s._count.products === 0 && (
                        <button
                          onClick={() => {
                            setDeleteTarget(s.id);
                            setDeleteError("");
                          }}
                          className="p-1.5 rounded-md text-[#94a3b8] hover:text-rose-500 hover:bg-rose-50 transition-all"
                          title="Delete supplier"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 9 : 8} className="p-8 text-center text-[#94a3b8]">
                    No suppliers registered yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#e2e8f0] bg-[#fafbfc]">
            <span className="text-xs text-[#64748b]">
              Showing {paged.length} of {filtered.length} suppliers
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-[#64748b] hover:bg-[#f1f5f9] disabled:opacity-30 disabled:pointer-events-none transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {renderPageNumbers()}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-[#64748b] hover:bg-[#f1f5f9] disabled:opacity-30 disabled:pointer-events-none transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => {
          setDeleteTarget(null);
          setDeleteError("");
        }}
        onConfirm={handleDelete}
        title="Delete Supplier"
        message={
          deleteError ||
          "Are you sure you want to delete this supplier? This action cannot be undone."
        }
        confirmLabel={deleteLoading ? "Deleting..." : "Delete"}
        variant="danger"
      />

      {/* Edit Supplier Modal */}
      {editId && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center">
          <div
            className="bg-white rounded-xl shadow-2xl border border-[#e2e8f0] w-full max-w-lg mx-4 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#e2e8f0] shrink-0">
              <h2 className="text-lg font-bold text-[#0e212c]">
                Edit Supplier
              </h2>
              <button
                onClick={() => setEditId(null)}
                className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                  Company Name *
                </label>
                <input
                  value={editForm.supplierName}
                  onChange={(e) =>
                    setEditForm({ ...editForm, supplierName: e.target.value })
                  }
                  required
                  className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                    Contact Person
                  </label>
                  <input
                    value={editForm.contactName}
                    onChange={(e) =>
                      setEditForm({ ...editForm, contactName: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                    Contact Number
                  </label>
                  <input
                    value={editForm.contactNumber}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        contactNumber: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                  TIN
                </label>
                <input
                  value={editForm.tin}
                  onChange={(e) =>
                    setEditForm({ ...editForm, tin: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                  Address
                </label>
                <input
                  value={editForm.address}
                  onChange={(e) =>
                    setEditForm({ ...editForm, address: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a]"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditId(null)}
                  className="flex-1 py-2.5 border border-[#e2e8f0] text-sm font-medium text-[#64748b] rounded-lg hover:bg-[#f8fafc] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#fd761a] to-[#e56600] text-white text-sm font-semibold rounded-lg shadow-lg shadow-[#fd761a]/20 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center">
          <div
            className="bg-white rounded-xl shadow-2xl border border-[#e2e8f0] w-full max-w-lg mx-4 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#e2e8f0] shrink-0">
              <h2 className="text-lg font-bold text-[#0e212c]">Add Supplier</h2>
              <button
                onClick={() => setShowAdd(false)}
                className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form
              onSubmit={handleAdd}
              className="p-6 space-y-4 flex-1 overflow-y-auto"
            >
              <div>
                <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                  Company Name *
                </label>
                <input
                  value={form.supplierName}
                  onChange={(e) =>
                    setForm({ ...form, supplierName: e.target.value })
                  }
                  required
                  className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                    Contact Person
                  </label>
                  <input
                    value={form.contactName}
                    onChange={(e) =>
                      setForm({ ...form, contactName: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                    Contact Number
                  </label>
                  <input
                    value={form.contactNumber}
                    onChange={(e) =>
                      setForm({ ...form, contactNumber: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                  TIN
                </label>
                <input
                  value={form.tin}
                  onChange={(e) => setForm({ ...form, tin: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                  Address
                </label>
                <input
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a]"
                />
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
                    "Add Supplier"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {productModalSupplier &&
        (() => {
          const totalPages = Math.ceil(
            productModalProducts.length / PRODUCT_MODAL_PAGE_SIZE,
          );
          const paged = productModalProducts.slice(
            (productModalPage - 1) * PRODUCT_MODAL_PAGE_SIZE,
            productModalPage * PRODUCT_MODAL_PAGE_SIZE,
          );
          return (
            <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center">
              <div
                className="bg-white rounded-xl shadow-2xl border border-[#e2e8f0] w-full max-w-3xl mx-4 max-h-[85vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#e2e8f0] shrink-0">
                  <h2 className="text-lg font-bold text-[#0e212c]">
                    Products from &quot;{productModalSupplier.name}&quot;
                  </h2>
                  <button
                    onClick={() => setProductModalSupplier(null)}
                    className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b] transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {productModalLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-[#fd761a]" />
                    </div>
                  ) : productModalProducts.length === 0 ? (
                    <p className="text-center text-[#94a3b8] py-12">
                      No products from this supplier.
                    </p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                          <th className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                            Product
                          </th>
                          <th className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                            Category
                          </th>
                          <th className="text-right p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                            Unit Price
                          </th>
                          <th className="text-right p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                            Selling Price
                          </th>
                          <th className="text-right p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                            Qty
                          </th>
                          <th className="text-center p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f1f5f9]">
                        {paged.map((p) => {
                          const isOut = p.quantity === 0;
                          const isLow =
                            p.quantity > 0 && p.quantity <= p.minThreshold;
                          return (
                            <tr
                              key={p.id}
                              className="hover:bg-[#f8fafc] transition-colors"
                            >
                              <td className="p-4 font-medium text-[#0e212c]">
                                {p.productName}
                              </td>
                              <td className="p-4 text-[#64748b]">
                                {p.category || "\u2014"}
                              </td>
                              <td className="p-4 text-right font-mono text-[#94a3b8]">
                                {p.unitPrice
                                  ? Number(p.unitPrice).toLocaleString(
                                      "en-PH",
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      },
                                    )
                                  : "\u2014"}
                              </td>
                              <td className="p-4 text-right font-mono text-[#0e212c]">
                                {Number(p.sellingPrice).toLocaleString(
                                  "en-PH",
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  },
                                )}
                              </td>
                              <td
                                className={`p-4 text-right font-mono ${isOut ? "text-rose-600 font-bold" : isLow ? "text-amber-600 font-bold" : "text-[#0e212c]"}`}
                              >
                                {p.quantity}
                              </td>
                              <td className="p-4 text-center">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${isOut ? "bg-rose-50 text-rose-700 border border-rose-200" : isLow ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}
                                >
                                  {isOut ? "OUT" : isLow ? "LOW" : "IN STOCK"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-3 border-t border-[#e2e8f0] shrink-0 text-xs text-[#64748b]">
                    <span>
                      {productModalProducts.length} product
                      {productModalProducts.length !== 1 ? "s" : ""}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        disabled={productModalPage === 1}
                        onClick={() =>
                          setProductModalPage((p) => Math.max(1, p - 1))
                        }
                        className="p-1 rounded hover:bg-[#f1f5f9] disabled:opacity-30 transition-colors"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      <span className="px-2">
                        {productModalPage} / {totalPages}
                      </span>
                      <button
                        disabled={productModalPage === totalPages}
                        onClick={() =>
                          setProductModalPage((p) =>
                            Math.min(totalPages, p + 1),
                          )
                        }
                        className="p-1 rounded hover:bg-[#f1f5f9] disabled:opacity-30 transition-colors"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
    </div>
  );
}
