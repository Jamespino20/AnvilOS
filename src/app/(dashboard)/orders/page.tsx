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
  getDeliverers,
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
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/skeleton";
import { ExportDialog } from "@/components/export-dialog";
import { ImportButton } from "@/components/import-button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import type { Transaction, TransactionItem, Product } from "@prisma/client";
import { toast } from "sonner";

type TxnWithItems = Transaction & { items: TransactionItem[] };

const DELIVERY_OPTIONS = ["", "Delivery", "COD", "Pickup", "WalkIn"];
const PER_PAGE = 15;

const STAGE_LABELS: Record<string, string> = {
  Ongoing: "Placed",
  Processing: "Processing",
  OnTheWay: "On the Way",
  Completed: "Completed",
  Cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  Ongoing: "bg-amber-50 text-amber-700 border border-amber-200",
  Processing: "bg-sky-50 text-sky-700 border border-sky-200",
  OnTheWay: "bg-violet-50 text-violet-700 border border-violet-200",
  Completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Cancelled: "bg-rose-50 text-rose-700 border border-rose-200",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<TxnWithItems[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [deliverers, setDeliverers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deliveryFilter, setDeliveryFilter] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Delivery tracking fields
  const [deliveryRef, setDeliveryRef] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [delivererName, setDelivererName] = useState("");

  // Confirm action modal
  const [confirmAction, setConfirmAction] = useState<{
    id: number;
    type: "advance" | "cancel";
    nextStatus?: string;
  } | null>(null);

  // Edit form state
  const [editStatus, setEditStatus] = useState<
    "Ongoing" | "Processing" | "OnTheWay" | "Completed" | "Cancelled"
  >("Ongoing");
  const [editBuyer, setEditBuyer] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editContact, setEditContact] = useState("");
  const [editDeliveryRef, setEditDeliveryRef] = useState("");
  const [editDeliveryNotes, setEditDeliveryNotes] = useState("");
  const [editDelivererName, setEditDelivererName] = useState("");
  const [editItems, setEditItems] = useState<
    {
      productId: number;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }[]
  >([]);

  function loadOrders() {
    setLoading(true);
    Promise.all([
      getTransactions({ statusIn: ["Ongoing", "Processing", "OnTheWay"], type: "SalePO" }),
      getProducts({ status: "available" }),
      getDeliverers(),
    ]).then(([txns, prods, delivs]) => {
      const all = txns as TxnWithItems[];
      setOrders(all);
      setTotal(all.length);
      setDeliverers(delivs);
      setLoading(false);
    });
  }

  useEffect(() => {
    loadOrders();
  }, []);

  function displayName(item: TransactionItem) {
    if (item.productName) return item.productName;
    const p = products.find((x) => x.id === item.productId);
    return p ? p.productName : `Product #${item.productId}`;
  }

  function openEdit(t: TxnWithItems) {
    setEditId(t.id);
    setEditStatus(t.transactionStatus as "Ongoing" | "Processing" | "OnTheWay" | "Completed" | "Cancelled");
    setEditBuyer(t.buyerName);
    setEditAddress(t.buyerAddress || "");
    setEditContact(t.buyerContact || "");
    setEditDeliveryRef(t.deliveryRef || "");
    setEditDeliveryNotes(t.deliveryNotes || "");
    setEditDelivererName(t.delivererName || "");
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
        deliveryRef: editDeliveryRef,
        deliveryNotes: editDeliveryNotes,
        delivererName: editDelivererName,
        transactionStatus: editStatus,
        items: editItems,
      });
      loadOrders();
      setEditId(null);
      toast.success("Order updated");
    } catch (e: any) {
      toast.error(e.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  }

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
    setProcessingId(id);
    try {
    await updateTransactionStatus(id, next, { deliveryRef, deliveryNotes, delivererName });
    loadOrders();
    toast.success("Order advanced");
  } catch (e: any) {
    toast.error(e.message || "Failed to advance status");
    } finally {
      setProcessingId(null);
    }
  }

  async function cancelOrder(id: number) {
    setProcessingId(id);
    try {
    await updateTransactionStatus(id, "Cancelled");
    loadOrders();
    toast.success("Order cancelled");
  } catch (e: any) {
    toast.error(e.message || "Failed to cancel");
    } finally {
      setProcessingId(null);
    }
  }

  const filtered = orders.filter((o) => {
    const matchesSearch =
      o.buyerName.toLowerCase().includes(search.toLowerCase()) ||
      String(o.receiptNumber).includes(search);
    const matchesDelivery = !deliveryFilter || o.deliveryMethod === deliveryFilter;
    return matchesSearch && matchesDelivery;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function isProcessing(id: number) {
    return processingId === id;
  }

  function getAdvanceTitle(status: string) {
    switch (status) {
      case "Ongoing": return "Mark as Processing";
      case "Processing": return "Mark as On the Way";
      case "OnTheWay": return "Mark as Completed";
      default: return "";
    }
  }

  function getAdvanceIcon(status: string) {
    switch (status) {
      case "Ongoing": return Package;
      case "Processing": return Truck;
      case "OnTheWay": return CheckCircle;
      default: return Package;
    }
  }

  function getAdvanceColor(status: string) {
    switch (status) {
      case "Ongoing": return "text-amber-600 hover:bg-amber-50";
      case "Processing": return "text-sky-600 hover:bg-sky-50";
      case "OnTheWay": return "text-emerald-600 hover:bg-emerald-50";
      default: return "text-[#64748b] hover:bg-[#f1f5f9]";
    }
  }

  function statusIcon(order: TxnWithItems) {
    switch (order.transactionStatus) {
      case "Ongoing": return "bg-amber-50 text-amber-600";
      case "Processing": return "bg-sky-50 text-sky-600";
      case "OnTheWay": return "bg-violet-50 text-violet-600";
      case "Completed": return "bg-emerald-50 text-emerald-600";
      case "Cancelled": return "bg-rose-50 text-rose-500";
      default: return "bg-amber-50 text-amber-600";
    }
  }

  function StatusDots({ status }: { status: string }) {
    const stages = ["Ongoing", "Processing", "OnTheWay", "Completed"];
    const idx = stages.indexOf(status);
    return (
      <div className="flex items-center gap-1">
        {stages.map((s, i) => (
          <div
            key={s}
            className={`w-1.5 h-1.5 rounded-full ${
              i <= idx
                ? i === idx
                  ? "bg-[#fd761a]"
                  : "bg-emerald-500"
                : "bg-[#e2e8f0]"
            }`}
          />
        ))}
      </div>
    );
  }

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
        subtitle={`${filtered.length} active purchase order${filtered.length !== 1 ? "s" : ""} — manage purchase orders, update items, and track delivery status.`}
      />

      <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative w-full lg:flex-1 min-w-0 sm:min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by buyer or receipt..."
            className="w-full h-10 pl-10 pr-4 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10"
          />
        </div>
        <div className="flex gap-2 w-full lg:w-auto flex-wrap">
          <select
            value={deliveryFilter}
            onChange={(e) => { setDeliveryFilter(e.target.value); setPage(1); }}
            className="h-10 px-3 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a]"
          >
            <option value="">All Delivery</option>
            {DELIVERY_OPTIONS.slice(1).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <ExportDialog
            filename={`cwl-hardware-purchase-orders-${new Date().toISOString().slice(0, 10)}.csv`}
            allColumns={[
              { key: "receiptNumber", label: "Receipt #" },
              { key: "buyerName", label: "Buyer" },
              { key: "items", label: "Items" },
              { key: "grandTotal", label: "Total" },
              { key: "transactionDate", label: "Date" },
              { key: "deliveryMethod", label: "Delivery" },
              { key: "transactionStatus", label: "Status" },
            ]}
            fetchRows={async (selectedColumns) => filtered.map((order) =>
              selectedColumns.map((key) => {
                if (key === "receiptNumber") return String(order.receiptNumber);
                if (key === "buyerName") return order.buyerName;
                if (key === "items") return String(order.items.length);
                if (key === "grandTotal") return `₱${Number(order.grandTotal || 0).toLocaleString()}`;
                if (key === "transactionDate") return new Date(order.transactionDate).toLocaleDateString("en-PH");
                if (key === "deliveryMethod") return order.deliveryMethod || "WalkIn";
                if (key === "transactionStatus") return STAGE_LABELS[order.transactionStatus] || order.transactionStatus;
                return "";
              })
            )}
          />
          <ImportButton table="transactions" onImported={() => window.location.reload()} title="Import purchase orders from CSV or XLSX" />
        </div>
      </div>

      <div className="space-y-2">
        {paginated.map((order) => {
          const isExpanded = expandedId === order.id;
          const isEditing = editId === order.id;
          const AdvanceIcon = getAdvanceIcon(order.transactionStatus);
          const pending = isProcessing(order.id);

          return (
            <div
              key={order.id}
              className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-4 flex items-center gap-4">
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${statusIcon(order)}`}>
                  <Package className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0 grid grid-cols-6 gap-3 text-sm items-center">
                  <div>
                    <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">Receipt</p>
                    <p className="font-mono text-[#0e212c] font-medium mt-0.5">#{order.receiptNumber}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">Buyer</p>
                    <p className="text-[#0e212c] font-medium mt-0.5 truncate">{order.buyerName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">Total</p>
                    <p className="font-mono text-[#0e212c] font-semibold mt-0.5">₱{Number(order.grandTotal || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">Delivery</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold mt-0.5 ${
                      order.deliveryMethod === "Delivery" ? "bg-sky-50 text-sky-700 border border-sky-200"
                        : order.deliveryMethod === "COD" ? "bg-violet-50 text-violet-700 border border-violet-200"
                          : order.deliveryMethod === "Pickup" ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-[#f1f5f9] text-[#64748b] border border-[#e2e8f0]"
                    }`}>{order.deliveryMethod || "WalkIn"}</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">Status</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        STATUS_COLORS[order.transactionStatus] || "bg-[#f1f5f9] text-[#64748b]"
                      }`}>{STAGE_LABELS[order.transactionStatus] || order.transactionStatus}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">Progress</p>
                    <div className="mt-1.5">
                      <StatusDots status={order.transactionStatus} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {order.transactionStatus !== "Cancelled" && order.transactionStatus !== "Completed" && (
                    <button
                      onClick={() => {
                        setDeliveryRef(order.deliveryRef || "");
                        setDeliveryNotes(order.deliveryNotes || "");
                        setDelivererName(order.delivererName || "");
                        setConfirmAction({ id: order.id, type: "advance" });
                      }}
                      disabled={pending}
                      className={`p-2 rounded-lg transition-all ${getAdvanceColor(order.transactionStatus)} disabled:opacity-40`}
                      title={getAdvanceTitle(order.transactionStatus)}
                    >
                      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <AdvanceIcon className="h-4 w-4" />}
                    </button>
                  )}
                  {order.transactionStatus !== "Cancelled" && (
                    <button
                      onClick={() => setConfirmAction({ id: order.id, type: "cancel" })}
                      disabled={pending}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all disabled:opacity-40"
                      title="Cancel order"
                    >
                      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                    </button>
                  )}
                  <button
                    onClick={() => openEdit(order)}
                    disabled={pending}
                    className="p-2 text-[#64748b] hover:bg-[#f1f5f9] rounded-lg transition-all"
                    title="Edit Order"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                    className="p-2 text-[#94a3b8] hover:bg-[#f1f5f9] rounded-lg transition-all"
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
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
                          <td className="py-2 text-[#0e212c] font-medium">{displayName(item)}</td>
                          <td className="py-2 text-right text-[#64748b]">{item.quantity}</td>
                          <td className="py-2 text-right font-mono text-[#64748b]">₱{Number(item.unitPrice).toLocaleString()}</td>
                          <td className="py-2 text-right font-mono text-[#0e212c] font-semibold">₱{Number(item.totalPrice).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex flex-wrap items-center gap-4 mt-3">
                    <span className="text-[10px] font-semibold text-[#94a3b8] uppercase">Address:</span>
                    <span className="text-sm text-[#64748b]">{order.buyerAddress || "N/A"}</span>
                    <span className="text-[10px] font-semibold text-[#94a3b8] uppercase">Contact:</span>
                    <span className="text-sm text-[#64748b]">{order.buyerContact || "N/A"}</span>
                  </div>
                  {(order.deliveryRef || order.deliveryNotes) && (
                    <div className="flex flex-wrap items-center gap-4 mt-2 pt-2 border-t border-[#e2e8f0]">
                      {order.delivererName && (
                    <>
                      <span className="text-[10px] font-semibold text-[#94a3b8] uppercase">Deliverer:</span>
                      <span className="text-sm text-[#64748b]">{order.delivererName}</span>
                    </>
                  )}
                  {order.deliveryRef && (
                    <>
                      <span className="text-[10px] font-semibold text-[#94a3b8] uppercase">Delivery Ref:</span>
                      <span className="text-sm text-[#64748b]">{order.deliveryRef}</span>
                    </>
                  )}
                  {order.deliveryNotes && (
                    <>
                      <span className="text-[10px] font-semibold text-[#94a3b8] uppercase">Delivery Notes:</span>
                      <span className="text-sm text-[#64748b]">{order.deliveryNotes}</span>
                    </>
                  )}
                    </div>
                  )}
                  {(order.deliveryMethod === "Delivery" || order.deliveryMethod === "COD" || order.deliveryMethod === "Pickup") && (
                    <div className="mt-4 pt-3 border-t border-[#e2e8f0]">
                      <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">
                        {order.deliveryMethod === "Delivery" ? "Delivery Tracking" : order.deliveryMethod === "COD" ? "COD Tracking" : "Pickup Tracking"}
                      </p>
                      <div className="flex items-center gap-0">
                        {["Placed", "Processing", order.deliveryMethod === "Pickup" ? "Ready" : "On the Way", "Completed"].map((stage, i) => {
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
                              {i < statusMap.length - 1 && <div className={`w-6 h-px ${isActive && i < currentIdx ? "bg-emerald-300" : "bg-[#e2e8f0]"}`} />}
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
                    <h3 className="font-semibold text-sm text-[#0e212c]">Edit Order #{order.receiptNumber}</h3>
                    <button onClick={() => setEditId(null)} className="p-1.5 text-[#94a3b8] hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><X className="h-4 w-4" /></button>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-1">Buyer</label>
                      <input type="text" value={editBuyer} onChange={(e) => setEditBuyer(e.target.value)}
                        className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-1">Address</label>
                      <input type="text" value={editAddress} onChange={(e) => setEditAddress(e.target.value)}
                        className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-1">Contact</label>
                      <input type="text" value={editContact} onChange={(e) => setEditContact(e.target.value)}
                        className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-1">Delivery Reference</label>
                      <input type="text" value={editDeliveryRef} onChange={(e) => setEditDeliveryRef(e.target.value)}
                        className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-1">Delivery Notes</label>
                      <input type="text" value={editDeliveryNotes} onChange={(e) => setEditDeliveryNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-1">Deliverer</label>
                      <input type="text" value={editDelivererName} onChange={(e) => setEditDelivererName(e.target.value)}
                        list="edit-deliverers"
                        placeholder="Select or type deliverer name"
                        className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10" />
                      <datalist id="edit-deliverers">
                        {deliverers.map((d) => (
                          <option key={d} value={d} />
                        ))}
                      </datalist>
                    </div>
                    <div className="flex items-end pb-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
                        editStatus === "Completed" ? "bg-emerald-50 text-emerald-700"
                          : editStatus === "OnTheWay" ? "bg-violet-50 text-violet-700"
                            : editStatus === "Processing" ? "bg-sky-50 text-sky-700"
                              : editStatus === "Cancelled" ? "bg-rose-50 text-rose-700"
                                : "bg-amber-50 text-amber-700"
                      }`}>
                        {STAGE_LABELS[editStatus]}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">Line Items</label>
                      <button onClick={() => setEditItems([...editItems, { productId: 0, quantity: 1, unitPrice: 0, totalPrice: 0 }])}
                        disabled={editStatus === "OnTheWay"}
                        className="text-xs font-semibold text-[#fd761a] hover:text-[#e56600] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        title={editStatus === "OnTheWay" ? "Cannot add items once order is On the Way" : "Add Item"}>+ Add Item</button>
                    </div>
                    <div className="space-y-2">
                      {editItems.map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <select value={item.productId || ""} onChange={(e) => {
                            const newItems = [...editItems];
                            const pid = Number(e.target.value);
                            const prod = products.find((p) => p.id === pid);
                            newItems[i] = { ...item, productId: pid, unitPrice: Number(prod?.unitPrice || 0), totalPrice: Number(prod?.unitPrice || 0) * item.quantity };
                            setEditItems(newItems);
                          }} className="flex-1 min-w-[180px] px-2 py-1.5 border border-[#e2e8f0] rounded text-sm focus:outline-none focus:border-[#fd761a]">
                            <option value="">Select product</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>{p.productName}{(p as any).imageUrl ? " 📷" : ""}</option>
                            ))}
                          </select>
                          <label className="text-[10px] font-semibold text-[#94a3b8] uppercase shrink-0">Qty</label>
                          <input type="number" min={1} value={item.quantity} onChange={(e) => {
                            const newItems = [...editItems];
                            const qty = Math.max(1, Number(e.target.value) || 1);
                            newItems[i] = { ...item, quantity: qty, totalPrice: qty * item.unitPrice };
                            setEditItems(newItems);
                          }} disabled={editStatus === "OnTheWay"}
                            className="w-16 px-2 py-1.5 border border-[#e2e8f0] rounded text-sm focus:outline-none focus:border-[#fd761a] disabled:bg-[#f1f5f9] disabled:cursor-not-allowed" />
                          <span className="text-sm font-mono text-[#0e212c] w-20 text-right">₱{item.unitPrice.toLocaleString()}</span>
                          <span className="text-sm font-mono text-[#fd761a] font-semibold w-24 text-right">₱{item.totalPrice.toLocaleString()}</span>
                          <button onClick={() => setEditItems(editItems.filter((_, j) => j !== i))}
                            disabled={editStatus === "OnTheWay"}
                            className="p-1.5 text-[#94a3b8] hover:text-rose-500 hover:bg-rose-50 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed"><X className="h-3.5 w-3.5" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2 border-t border-[#e2e8f0]">
                    <button onClick={() => setEditId(null)}
                      className="px-5 py-2 border border-[#e2e8f0] text-sm font-medium text-[#64748b] rounded-lg hover:bg-white transition-all">Cancel</button>
                    <button onClick={handleSave} disabled={saving}
                      className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-[#fd761a] to-[#e56600] text-white rounded-lg font-semibold text-sm shadow-lg shadow-[#fd761a]/20 hover:from-[#e56600] hover:to-[#d45d00] transition-all active:scale-[0.98] disabled:opacity-50">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />} Save Changes
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {paginated.length === 0 && (
          <div className="text-center py-16 text-[#94a3b8]">
            <Package className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p className="font-medium">All orders completed</p>
            <p className="text-xs mt-1">No active purchase orders match your filters</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 flex items-center justify-between text-sm text-[#64748b]">
          <span>
            Showing {paginated.length} of {filtered.length} items
          </span>
          <div className="flex items-center gap-1">
            <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-md text-[#64748b] hover:bg-[#f1f5f9] disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              <ChevronLeft className="h-4 w-4" />
            </button>
            {(() => {
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
                if (start > 1) pages.push(<span key="s" className="px-1 text-[#94a3b8] text-xs">...</span>);
                for (let i = start; i <= end; i++) {
                  pages.push(
                    <button key={i} onClick={() => setPage(i)}
                      className={`min-w-[28px] h-7 text-xs font-semibold rounded-md transition-all ${i === page ? "bg-[#fd761a] text-white shadow-sm" : "text-[#64748b] hover:bg-[#f1f5f9]"}`}>
                      {i}
                    </button>
                  );
                }
                if (end < totalPages) pages.push(<span key="e" className="px-1 text-[#94a3b8] text-xs">...</span>);
              }
              return pages;
            })()}
            <button disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-md text-[#64748b] hover:bg-[#f1f5f9] disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Confirm action modal */}
      {confirmAction && (() => {
        const order = orders.find((o) => o.id === confirmAction.id);
        if (!order || order.transactionStatus === "Cancelled" || order.transactionStatus === "Completed") return null;
        const isAdvance = confirmAction.type === "advance";
        const nextStatus = isAdvance
          ? ({ Ongoing: "Processing", Processing: "OnTheWay", OnTheWay: "Completed" } as Record<string, string>)[order.transactionStatus] || ""
          : "Cancelled";
        const nextLabel = nextStatus ? STAGE_LABELS[nextStatus] || nextStatus : "";
        return (
          <ConfirmModal
            open={true}
            title={isAdvance ? `Advance to "${nextLabel}"?` : `Cancel Order #${order.receiptNumber}?`}
            message={
              isAdvance
                ? `Move this order from "${STAGE_LABELS[order.transactionStatus]}" to "${nextLabel}".`
                : `This will cancel order #${order.receiptNumber} for ${order.buyerName}. This action cannot be undone.`
            }
            confirmLabel={isAdvance ? `Advance to ${nextLabel}` : "Yes, Cancel Order"}
            variant={isAdvance ? "warning" : "danger"}
            onConfirm={() => {
              if (isAdvance) advanceStatus(confirmAction.id);
              else cancelOrder(confirmAction.id);
              setConfirmAction(null);
            }}
            onClose={() => setConfirmAction(null)}
          >
            {isAdvance && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-1">Deliverer Name</label>
                  <input type="text" value={delivererName} onChange={(e) => setDelivererName(e.target.value)}
                    list="advance-deliverers"
                    placeholder="Select or type deliverer name"
                    className="w-full px-3 py-1.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10" />
                  <datalist id="advance-deliverers">
                    {deliverers.map((d) => (
                      <option key={d} value={d} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-1">Delivery Reference / Tracking #</label>
                  <input type="text" value={deliveryRef} onChange={(e) => setDeliveryRef(e.target.value)}
                    placeholder="e.g. Courier tracking number"
                    className="w-full px-3 py-1.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-1">Delivery Notes</label>
                  <textarea value={deliveryNotes} onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="Optional notes about delivery..."
                    rows={2}
                    className="w-full px-3 py-1.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10 resize-none" />
                </div>
              </div>
            )}
          </ConfirmModal>
        );
      })()}
    </div>
  );
}
