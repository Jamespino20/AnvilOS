/*
App Name: AnvilOS
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: 
*/

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSuppliers as fetchSuppliers, createSupplier, updateSupplier } from "@/actions";
import { Plus, Truck, Mail, Phone, MapPin, X, Loader2, Edit3, Save } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import type { Supplier } from "@prisma/client";

export default function SuppliersPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<(Supplier & { _count: { products: number } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ supplierName: "", contactName: "", contactNumber: "", email: "", address: "" });
  const [editForm, setEditForm] = useState({ supplierName: "", contactName: "", contactNumber: "", email: "", address: "", isAvailable: true });

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
      setForm({ supplierName: "", contactName: "", contactNumber: "", email: "", address: "" });
      router.refresh();
    } catch (e) {
      console.error("Failed to add supplier", e);
    } finally {
      setAdding(false);
    }
  }

  function openEdit(s: typeof suppliers[number]) {
    setEditId(s.id);
    setEditForm({ supplierName: s.supplierName, contactName: s.contactName || "", contactNumber: s.contactNumber || "", email: s.email || "", address: s.address || "", isAvailable: s.isAvailable });
  }

  async function handleSaveEdit() {
    if (!editId) return;
    setSaving(true);
    try {
      await updateSupplier(editId, editForm);
      setSuppliers((prev) => prev.map((s) => s.id === editId ? { ...s, ...editForm } : s));
      setEditId(null);
    } catch (e) {
      console.error("Failed to update supplier", e);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-[#64748b]">Loading suppliers...</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <PageHeader title="Supplier Management" subtitle="Manage your supply chain partners — add, edit, and toggle supplier availability." />
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#fd761a] to-[#e56600] text-white text-sm font-semibold rounded-lg shadow-lg shadow-[#fd761a]/20 hover:shadow-xl hover:shadow-[#fd761a]/25 transition-all duration-200 active:scale-[0.98]">
          <Plus className="h-4 w-4" /> Add Supplier
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((s) => (
          <div key={s.id} className="bg-white border border-[#e2e8f0] rounded-xl p-5 space-y-3 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#fd761a]/10 to-[#fd761a]/5 flex items-center justify-center">
                <Truck className="h-5 w-5 text-[#fd761a]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[#0e212c] text-sm truncate">{s.supplierName}</h3>
                <span className={`inline-block mt-0.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${s.isAvailable ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                  {s.isAvailable ? "Active" : "Inactive"}
                </span>
              </div>
              <button onClick={() => openEdit(s)} className="p-2 text-[#94a3b8] hover:text-[#fd761a] hover:bg-[#fff5ed] rounded-lg transition-all" title="Edit Supplier">
                <Edit3 className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1.5 text-sm text-[#64748b]">
              {s.contactName && <div className="flex items-center gap-2"><span className="font-medium text-[#0e212c] shrink-0">Contact:</span> {s.contactName}</div>}
              {!s.contactName && <div className="flex items-center gap-2 text-[#cbd5e1] italic"><span className="font-medium shrink-0">Contact:</span> No contact person</div>}
              {s.contactNumber ? <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-[#94a3b8] shrink-0" /> {s.contactNumber}</div>
                : <div className="flex items-center gap-2 text-[#cbd5e1] italic"><Phone className="h-3.5 w-3.5 shrink-0" /> No contact number</div>}
              {s.email ? <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-[#94a3b8] shrink-0" /> {s.email}</div>
                : <div className="flex items-center gap-2 text-[#cbd5e1] italic"><Mail className="h-3.5 w-3.5 shrink-0" /> No email</div>}
              {s.address ? <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-[#94a3b8] shrink-0" /> {s.address}</div>
                : <div className="flex items-center gap-2 text-[#cbd5e1] italic"><MapPin className="h-3.5 w-3.5 shrink-0" /> No address</div>}
            </div>
            <div className="pt-2 border-t border-[#e2e8f0] text-xs text-[#94a3b8]">
              {s._count.products} product(s) linked
            </div>
          </div>
        ))}
        {suppliers.length === 0 && (
          <div className="col-span-full text-center py-12 text-[#94a3b8]">No suppliers registered yet</div>
        )}
      </div>

      {/* Edit Supplier Modal */}
      {editId && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center" onClick={() => setEditId(null)}>
          <div className="bg-white rounded-xl shadow-2xl border border-[#e2e8f0] w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#e2e8f0]">
              <h2 className="text-lg font-bold text-[#0e212c]">Edit Supplier</h2>
              <button onClick={() => setEditId(null)} className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b] transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">Company Name *</label>
                <input value={editForm.supplierName} onChange={(e) => setEditForm({ ...editForm, supplierName: e.target.value })} required
                  className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">Contact Person</label>
                  <input value={editForm.contactName} onChange={(e) => setEditForm({ ...editForm, contactName: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">Contact Number</label>
                  <input value={editForm.contactNumber} onChange={(e) => setEditForm({ ...editForm, contactNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a]" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">Email</label>
                <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">Address</label>
                <input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a]" />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Status</label>
                <button onClick={() => setEditForm({ ...editForm, isAvailable: !editForm.isAvailable })}
                  className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${editForm.isAvailable ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
                  {editForm.isAvailable ? "Active" : "Inactive"}
                </button>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditId(null)}
                  className="flex-1 py-2.5 border border-[#e2e8f0] text-sm font-medium text-[#64748b] rounded-lg hover:bg-[#f8fafc] transition-all">Cancel</button>
                <button onClick={handleSaveEdit} disabled={saving}
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#fd761a] to-[#e56600] text-white text-sm font-semibold rounded-lg shadow-lg shadow-[#fd761a]/20 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> Save Changes</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-xl shadow-2xl border border-[#e2e8f0] w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#e2e8f0]">
              <h2 className="text-lg font-bold text-[#0e212c]">Add Supplier</h2>
              <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b] transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">Company Name *</label>
                <input value={form.supplierName} onChange={(e) => setForm({ ...form, supplierName: e.target.value })} required
                  className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">Contact Person</label>
                  <input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">Contact Number</label>
                  <input value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a]" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">Address</label>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a]" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)}
                  className="flex-1 py-2.5 border border-[#e2e8f0] text-sm font-medium text-[#64748b] rounded-lg hover:bg-[#f8fafc] transition-all">Cancel</button>
                <button type="submit" disabled={adding}
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#fd761a] to-[#e56600] text-white text-sm font-semibold rounded-lg shadow-lg shadow-[#fd761a]/20 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {adding ? <><Loader2 className="h-4 w-4 animate-spin" /> Adding...</> : "Add Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
