/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: May 24, 2026
*/

"use client";

import { useState, useEffect } from "react";
import {
  getTransactions,
  getProducts,
  updateTransactionStatus,
  updateTransaction,
} from "@/actions";
import {
  Search,
  Loader2,
  Package,
  CheckCircle,
  XCircle,
  Edit3,
  X,
  ChevronDown,
  ChevronUp,
  Truck,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/skeleton";
import { ExportDialog } from "@/components/export-dialog";
import { ImportButton } from "@/components/import-button";
import type { Transaction, TransactionItem, Product } from "@prisma/client";

type TxnWithItems = Transaction & { items: TransactionItem[] };

export default function OrdersPage() {
  const [orders, setOrders] = useState<TxnWithItems[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Edit form state
  const [editStatus, setEditStatus] = useState<
    "Ongoing" | "Processing" | "OnTheWay" | "Completed" | "Cancelled"
  >("Ongoing");
  const [editBuyer, setEditBuyer] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editContact, setEditContact] = useState("");
  const [editItems, setEditItems] = useState<
    {
      productId: number;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }[]
  >([]);

  useEffect(() => {
    Promise.all([
      getTransactions({ statusIn: ["Ongoing", "Processing", "OnTheWay"], type: "SalePO" }),
      getProducts({ status: "available" }),
    ]).then(([txns, prods]) => {
      setOrders(txns as TxnWithItems[]);
      setProducts(prods as Product[]);
      setLoading(false);
    });
  }, []);

  function productLabel(id: number) {
    const p = products.find((p) => p.id === id);
    return p ? `#${id} · ${p.productName}` : `#${id}`;
  }

  function openEdit(t: TxnWithItems) {
    setEditId(t.id);
    setEditStatus(t.transactionStatus as "Ongoing" | "Processing" | "OnTheWay" | "Completed" | "Cancelled");
    setEditBuyer(t.buyerName);
    setEditAddress(t.buyerAddress || "");
    setEditContact(t.buyerContact || "");
    setEditItems(
      t.items.map((i) => ({
        productId: i.productId!,
        quantity: i.quantity!,
        unitPrice: Number(i.unitPrice!),
        totalPrice: Number(i.totalPrice!),
      })),
    );
  }

  async function handleSave() {
    if (!editId) return;
    setSaving(true);
    try {
      await updateTransaction(editId, {
        buyerName: editBuyer,
        buyerAddress: editAddress,
        buyerContact: editContact,
        transactionStatus: editStatus,
        items: editItems,
      });
      const data = await getTransactions({ statusIn: ["Ongoing", "Processing", "OnTheWay"], type: "SalePO" });
      setOrders(data as TxnWithItems[]);
      setEditId(null);
    } catch (e: any) {
      alert(e.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  // Advance to next delivery status
  async function advanceStatus(id: number) {
    const order = orders.find((o) => o.id === id);
    if (!order) return;
    const nextStatus: Record<string, "Processing" | "OnTheWay" | "Completed"> = {
      Ongoing: "Processing",
      Processing: "OnTheWay",
      OnTheWay: "Completed",
    };
    const next = nextStatus[order.transactionStatus];
    if (!next) return;
    try {
      await updateTransactionStatus(id, next);
      const data = await getTransactions({ statusIn: ["Ongoing", "Processing", "OnTheWay"], type: "SalePO" });
      setOrders(data as TxnWithItems[]);
    } catch (e: any) {
      alert(e.message || "Failed to advance status");
    }
  }

  async function cancelOrder(id: number) {
    try {
      await updateTransactionStatus(id, "Cancelled");
      const data = await getTransactions({ statusIn: ["Ongoing", "Processing", "OnTheWay"], type: "SalePO" });
      setOrders(data as TxnWithItems[]);
    } catch (e: any) {
      alert(e.message || "Failed to cancel");
    }
  }

  const filtered = orders.filter(
    (o) =>
      o.buyerName.toLowerCase().includes(search.toLowerCase()) ||
      String(o.receiptNumber).includes(search),
  );

  if (loading)
    return (
      <div className="space-y-5">
        <PageHeader title="Purchase Orders" subtitle="Loading..." />
        <TableSkeleton rows={6} cols={7} />
      </div>
    );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Purchase Orders"
        subtitle={`${orders.length} active purchase order${orders.length !== 1 ? "s" : ""} — manage purchase orders, update items, and track delivery status.`}
      />

      <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative w-full lg:flex-1 min-w-0 sm:min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by buyer or receipt..."
            className="w-full pl-10 pr-4 py-2.5 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10"
          />
        </div>
        <div className="flex gap-2 w-full lg:w-auto flex-wrap">
          <ExportDialog
            filename={`cwl-hardware-purchase-orders-${new Date().toISOString().slice(0, 10)}.csv`}
            allColumns={[
              { key: "receiptNumber", label: "Receipt #" },
              { key: "buyerName", label: "Buyer" },
              { key: "items", label: "Items" },
              { key: "grandTotal", label: "Total" },
              { key: "transactionDate", label: "Date" },
            ]}
            fetchRows={async (selectedColumns) => filtered.map((order) =>
              selectedColumns.map((key) => {
                if (key === "receiptNumber") return String(order.receiptNumber);
                if (key === "buyerName") return order.buyerName;
                if (key === "items") return String(order.items.length);
                if (key === "grandTotal") return `₱${Number(order.grandTotal || 0).toLocaleString()}`;
                if (key === "transactionDate") return new Date(order.transactionDate).toLocaleDateString("en-PH");
                return "";
              })
            )}
          />
          <ImportButton table="transactions" onImported={() => window.location.reload()} title="Import purchase orders from CSV or XLSX" />
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((order) => {
          const isExpanded = expandedId === order.id;
          const isEditing = editId === order.id;

          return (
            <div
              key={order.id}
              className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-4 flex items-center gap-4">
                <div className="w-11 h-11 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Package className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0 grid grid-cols-5 gap-4 text-sm">
                  <div>
                    <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">
                      Receipt
                    </p>
                    <p className="font-mono text-[#0e212c] font-medium mt-0.5">
                      #{order.receiptNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">
                      Buyer
                    </p>
                    <p className="text-[#0e212c] font-medium mt-0.5 truncate">
                      {order.buyerName}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">
                      Items
                    </p>
                    <p className="text-[#0e212c] font-medium mt-0.5">
                      {order.items.length} item
                      {order.items.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">
                      Total
                    </p>
                    <p className="font-mono text-[#0e212c] font-semibold mt-0.5">
                      ₱{Number(order.grandTotal || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">
                      Date
                    </p>
                    <p className="text-[#64748b] mt-0.5">
                      {new Date(order.transactionDate).toLocaleDateString(
                        "en-PH",
                        { month: "short", day: "numeric" },
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">
                      Delivery
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold mt-0.5 ${
                        order.deliveryMethod === "Delivery"
                          ? "bg-sky-50 text-sky-700 border border-sky-200"
                          : order.deliveryMethod === "COD"
                            ? "bg-violet-50 text-violet-700 border border-violet-200"
                            : order.deliveryMethod === "Pickup"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-[#f1f5f9] text-[#64748b] border border-[#e2e8f0]"
                      }`}
                    >
                      {order.deliveryMethod || "WalkIn"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {order.transactionStatus === "Ongoing" && (
                    <button
                      onClick={() => advanceStatus(order.id)}
                      className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                      title="Mark as Processing"
                    >
                      <Package className="h-4 w-4" />
                    </button>
                  )}
                  {order.transactionStatus === "Processing" && (
                    <button
                      onClick={() => advanceStatus(order.id)}
                      className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition-all"
                      title="Mark as On the Way"
                    >
                      <Truck className="h-4 w-4" />
                    </button>
                  )}
                  {order.transactionStatus === "OnTheWay" && (
                    <button
                      onClick={() => advanceStatus(order.id)}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                      title="Mark as Completed"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                  )}
                  {order.transactionStatus !== "Cancelled" && (
                    <button
                      onClick={() => cancelOrder(order.id)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                      title="Cancel"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => openEdit(order)}
                    className="p-2 text-[#64748b] hover:bg-[#f1f5f9] rounded-lg transition-all"
                    title="Edit Order"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                    className="p-2 text-[#94a3b8] hover:bg-[#f1f5f9] rounded-lg transition-all"
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {isExpanded && !isEditing && (
                <div className="border-t border-[#e2e8f0] bg-[#f8fafc] p-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">
                        <th className="text-left pb-2">Product</th>
                        <th className="text-right pb-2">Qty</th>
                        <th className="text-right pb-2">Unit Price</th>
                        <th className="text-right pb-2">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e2e8f0]">
                      {order.items.map((item) => (
                        <tr key={item.id}>
                          <td className="py-2 text-[#0e212c] font-medium">
                            {productLabel(item.productId!)}
                          </td>
                          <td className="py-2 text-right text-[#64748b]">
                            {item.quantity}
                          </td>
                          <td className="py-2 text-right font-mono text-[#64748b]">
                            ₱{Number(item.unitPrice).toLocaleString()}
                          </td>
                          <td className="py-2 text-right font-mono text-[#0e212c] font-semibold">
                            ₱{Number(item.totalPrice).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex flex-wrap items-center gap-4 mt-3">
                    <span className="text-[10px] font-semibold text-[#94a3b8] uppercase">
                      Address:
                    </span>
                    <span className="text-sm text-[#64748b]">
                      {order.buyerAddress || "N/A"}
                    </span>
                    <span className="text-[10px] font-semibold text-[#94a3b8] uppercase">
                      Contact:
                    </span>
                    <span className="text-sm text-[#64748b]">
                      {order.buyerContact || "N/A"}
                    </span>
                  </div>
                  {(order.deliveryMethod === "Delivery" || order.deliveryMethod === "COD" || order.deliveryMethod === "Pickup") && (
                    <div className="mt-4 pt-3 border-t border-[#e2e8f0]">
                      <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">
                        {order.deliveryMethod === "Delivery" ? "Delivery Tracking" : order.deliveryMethod === "COD" ? "COD Tracking" : "Pickup Tracking"}
                      </p>
                      <div className="flex items-center gap-0">
                        {["Placed", "Processing", order.deliveryMethod === "Pickup" ? "Ready" : "On the Way", "Completed"].map((stage, i, arr) => {
                          const statusMap = ["Ongoing", "Processing", "OnTheWay", "Completed"];
                          const currentIdx = statusMap.indexOf(order.transactionStatus);
                          const isActive = i <= currentIdx;
                          const isCurrent = i === currentIdx;
                          return (
                            <div key={stage} className="flex items-center">
                              <div className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold shrink-0 ${
                                isActive ? "bg-emerald-100 text-emerald-700" : "bg-[#f1f5f9] text-[#94a3b8]"
                              } ${isCurrent ? "ring-2 ring-emerald-300" : ""}`}>
                                {isActive ? "✓" : i + 1}
                              </div>
                              <span className={`mx-1 text-[9px] whitespace-nowrap ${isActive ? "text-[#0e212c] font-medium" : "text-[#94a3b8]"}`}>{stage}</span>
                              {i < arr.length - 1 && <div className="w-4 h-px bg-[#e2e8f0]" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isEditing && (
                <div className="border-t border-[#e2e8f0] p-5 space-y-4 bg-[#f8fafc]">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-[#0e212c]">
                      Edit Order #{order.receiptNumber}
                    </h3>
                    <button
                      onClick={() => setEditId(null)}
                      className="p-1.5 text-[#94a3b8] hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-1">
                        Buyer
                      </label>
                      <input
                        type="text"
                        value={editBuyer}
                        onChange={(e) => setEditBuyer(e.target.value)}
                        className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-1">
                        Address
                      </label>
                      <input
                        type="text"
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-1">
                        Contact
                      </label>
                      <input
                        type="text"
                        value={editContact}
                        onChange={(e) => setEditContact(e.target.value)}
                        className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-1">
                      Status
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                      className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10"
                    >
                      <option value="Ongoing">Placed</option>
                      <option value="Processing">Processing</option>
                      <option value="OnTheWay">On the Way</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                    {editStatus === "Completed" && (
                      <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Stock will be
                        deducted and earnings updated
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">
                        Line Items
                      </label>
                      <button
                        onClick={() =>
                          setEditItems([
                            ...editItems,
                            {
                              productId: 0,
                              quantity: 1,
                              unitPrice: 0,
                              totalPrice: 0,
                            },
                          ])
                        }
                        className="text-xs font-semibold text-[#fd761a] hover:text-[#e56600] transition-colors"
                      >
                        + Add Item
                      </button>
                    </div>
                    <div className="space-y-2">
                      {editItems.map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <select
                            value={item.productId || ""}
                            onChange={(e) => {
                              const newItems = [...editItems];
                              const pid = Number(e.target.value);
                              const prod = products.find((p) => p.id === pid);
                              newItems[i] = {
                                ...item,
                                productId: pid,
                                unitPrice: Number(prod?.unitPrice || 0),
                                totalPrice:
                                  Number(prod?.unitPrice || 0) * item.quantity,
                              };
                              setEditItems(newItems);
                            }}
                            className="flex-1 min-w-[180px] px-2 py-1.5 border border-[#e2e8f0] rounded text-sm focus:outline-none focus:border-[#fd761a]"
                          >
                            <option value="">Select product</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                #{p.id} · {p.productName}
                                {(p as any).imageUrl ? " 📷" : ""}
                              </option>
                            ))}
                          </select>
                          <label className="text-[10px] font-semibold text-[#94a3b8] uppercase shrink-0">
                            Qty
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => {
                              const newItems = [...editItems];
                              const qty = Math.max(
                                1,
                                Number(e.target.value) || 1,
                              );
                              newItems[i] = {
                                ...item,
                                quantity: qty,
                                totalPrice: qty * item.unitPrice,
                              };
                              setEditItems(newItems);
                            }}
                            className="w-16 px-2 py-1.5 border border-[#e2e8f0] rounded text-sm focus:outline-none focus:border-[#fd761a]"
                          />
                          <label className="text-[10px] font-semibold text-[#94a3b8] uppercase shrink-0">
                            Price
                          </label>
                          <span className="text-sm font-mono text-[#0e212c] w-20 text-right">
                            ₱{item.unitPrice.toLocaleString()}
                          </span>
                          <span className="text-sm font-mono text-[#fd761a] font-semibold w-24 text-right">
                            ₱{item.totalPrice.toLocaleString()}
                          </span>
                          <button
                            onClick={() =>
                              setEditItems(editItems.filter((_, j) => j !== i))
                            }
                            className="p-1.5 text-[#94a3b8] hover:text-rose-500 hover:bg-rose-50 rounded transition-all"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2 border-t border-[#e2e8f0]">
                    <button
                      onClick={() => setEditId(null)}
                      className="px-5 py-2 border border-[#e2e8f0] text-sm font-medium text-[#64748b] rounded-lg hover:bg-white transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-[#fd761a] to-[#e56600] text-white rounded-lg font-semibold text-sm shadow-lg shadow-[#fd761a]/20 hover:from-[#e56600] hover:to-[#d45d00] transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}{" "}
                      Save Changes
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-[#94a3b8]">
            <Package className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p className="font-medium">All orders completed</p>
            <p className="text-xs mt-1">
              No ongoing purchase orders at this time
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
