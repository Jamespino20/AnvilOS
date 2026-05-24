/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: May 24, 2026
*/

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getSuppliers as fetchSuppliers,
  createSupplier,
  updateSupplier,
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
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { CardSkeleton } from "@/components/ui/skeleton";
import { ExportDialog } from "@/components/export-dialog";
import { CSVImportButton } from "@/components/csv-import";
import type { Supplier } from "@prisma/client";

export default function SuppliersPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<
    (Supplier & { _count: { products: number } })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
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
  });
  const [editForm, setEditForm] = useState({
    supplierName: "",
    contactName: "",
    contactNumber: "",
    email: "",
    address: "",
    isAvailable: true,
  });

  useEffect(() => {
    fetchSuppliers().then((data) => {
      setSuppliers(data as any);
      setLoading(false);
    });
  }, []);

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
      });
      router.refresh();
    } catch (e) {
      console.error("Failed to add supplier", e);
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
      isAvailable: s.isAvailable,
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
    } catch (e) {
      console.error("Failed to update supplier", e);
    } finally {
      setSaving(false);
    }
  }

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

  if (loading)
    return (
      <div className="space-y-5">
        <PageHeader title="Supplier Management" subtitle="Loading..." />
        <CardSkeleton count={6} />
      </div>
    );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Supplier Management"
          subtitle="Manage your supply chain partners — add, edit, and toggle supplier availability."
        />
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#fd761a] to-[#e56600] text-white text-sm font-semibold rounded-lg shadow-lg shadow-[#fd761a]/20 hover:shadow-xl hover:shadow-[#fd761a]/25 transition-all duration-200 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" /> Add Supplier
          </button>
          <ExportDialog
            filename={`cwl-hardware-suppliers-${new Date().toISOString().slice(0, 10)}.csv`}
            allColumns={[
              { key: "supplierName", label: "Supplier Name" },
              { key: "contactName", label: "Contact Person" },
              { key: "contactNumber", label: "Contact Number" },
              { key: "email", label: "Email" },
              { key: "address", label: "Address" },
              { key: "isAvailable", label: "Status" },
            ]}
            fetchRows={async (selectedColumns) => suppliers.map((s) =>
              selectedColumns.map((key) => {
                if (key === "supplierName") return s.supplierName;
                if (key === "contactName") return s.contactName || "";
                if (key === "contactNumber") return s.contactNumber || "";
                if (key === "email") return s.email || "";
                if (key === "address") return s.address || "";
                if (key === "isAvailable") return s.isAvailable ? "Active" : "Inactive";
                return "";
              })
            )}
            label="Export"
            title="Export suppliers"
          />
          <CSVImportButton
            table="suppliers"
            onImported={() => window.location.reload()}
            title="Import suppliers from CSV"
          />
        </div>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search suppliers..."
          className="w-full pl-9 pr-3 py-2 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a]"
        />
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
                  Email
                </th>
                <th className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                  Address
                </th>
                <th className="text-center p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                  Status
                </th>
                <th className="text-center p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                  Products
                </th>
                <th className="text-center p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
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
                  <td className="p-4 text-[#64748b]">{s.email || "—"}</td>
                  <td className="p-4 text-[#64748b] max-w-[200px] truncate">
                    {s.address || "—"}
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${s.isAvailable ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
                    >
                      {s.isAvailable ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-4 text-center text-[#64748b]">
                    {s._count.products}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => openEdit(s)}
                      className="p-2 text-[#94a3b8] hover:text-[#fd761a] hover:bg-[#fff5ed] rounded-lg transition-all"
                      title="Edit supplier details"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#94a3b8]">
                    No suppliers registered yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 border border-[#e2e8f0] rounded-lg text-[#64748b] hover:bg-white disabled:opacity-50 transition-all"
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${p === page ? "bg-[#fd761a] text-white" : "text-[#64748b] hover:bg-[#f1f5f9]"}`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 border border-[#e2e8f0] rounded-lg text-[#64748b] hover:bg-white disabled:opacity-50 transition-all"
          >
            Next
          </button>
        </div>
      )}

      {/* Edit Supplier Modal */}
      {editId && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setEditId(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl border border-[#e2e8f0] w-full max-w-lg mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#e2e8f0]">
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
            <div className="p-6 space-y-4">
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
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                  Status
                </label>
                <button
                  onClick={() =>
                    setEditForm({
                      ...editForm,
                      isAvailable: !editForm.isAvailable,
                    })
                  }
                  className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${editForm.isAvailable ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}
                >
                  {editForm.isAvailable ? "Active" : "Inactive"}
                </button>
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
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setShowAdd(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl border border-[#e2e8f0] w-full max-w-lg mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#e2e8f0]">
              <h2 className="text-lg font-bold text-[#0e212c]">Add Supplier</h2>
              <button
                onClick={() => setShowAdd(false)}
                className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
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
    </div>
  );
}
