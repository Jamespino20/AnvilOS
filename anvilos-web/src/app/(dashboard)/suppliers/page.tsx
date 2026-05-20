import { getSuppliers } from "@/actions";
import { Plus, Truck, Mail, Phone, MapPin } from "lucide-react";

export default async function SuppliersPage() {
  const suppliers = await getSuppliers();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-on-surface">Supplier Management</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-secondary text-on-secondary text-sm rounded hover:bg-secondary/90 transition-colors">
          <Plus className="h-4 w-4" /> Add Supplier
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((s) => (
          <div key={s.id} className="bg-white border border-outline rounded p-5 space-y-3 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{s.supplierName}</h3>
                <span className={`text-xs px-2 py-0.5 rounded ${s.isAvailable ? "bg-[#E6F4EA] text-[#137333]" : "bg-error-container text-on-error-container"}`}>
                  {s.isAvailable ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
            <div className="space-y-1 text-sm text-on-surface-variant">
              {s.contactName && (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-on-surface">Contact:</span> {s.contactName}
                </div>
              )}
              {s.contactNumber && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5" /> {s.contactNumber}
                </div>
              )}
              {s.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" /> {s.email}
                </div>
              )}
              {s.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" /> {s.address}
                </div>
              )}
            </div>
            <div className="pt-2 border-t border-outline/50 text-sm text-on-surface-variant">
              {s._count.products} product(s) linked
            </div>
          </div>
        ))}
        {suppliers.length === 0 && (
          <div className="col-span-full text-center py-12 text-on-surface-variant">No suppliers registered yet</div>
        )}
      </div>
    </div>
  );
}
