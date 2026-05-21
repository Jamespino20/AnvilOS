"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSuppliers as fetchSuppliers, createSupplier } from "@/actions";
import { Plus, Truck, Mail, Phone, MapPin, X, Loader2 } from "lucide-react";
import type { Supplier } from "@prisma/client";

export default function SuppliersPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<(Supplier & { _count: { products: number } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ supplierName: "", contactName: "", contactNumber: "", email: "", address: "" });

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

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-[#64748b]">Loading suppliers...</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#0e212c] tracking-tight">Supplier Management</h1>
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
              <div>
                <h3 className="font-semibold text-[#0e212c] text-sm">{s.supplierName}</h3>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${s.isAvailable ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                  {s.isAvailable ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
            <div className="space-y-1.5 text-sm text-[#64748b]">
              {s.contactName && <div className="flex items-center gap-2"><span className="font-medium text-[#0e212c]">Contact:</span> {s.contactName}</div>}
              {s.contactNumber && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-[#94a3b8]" /> {s.contactNumber}</div>}
              {s.email && <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-[#94a3b8]" /> {s.email}</div>}
              {s.address && <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-[#94a3b8]" /> {s.address}</div>}
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
                  className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">Contact Person</label>
                  <input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">Contact Number</label>
                  <input value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a]" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">Address</label>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a]" />
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
