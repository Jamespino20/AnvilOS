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
  getBuyers,
  getBuyerTransactions,
  getProducts,
  updateBuyerInfo,
} from "@/actions";
import {
  Search,
  Loader2,
  Users,
  Receipt,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Phone,
  MapPin,
  Calendar,
  Pencil,
  X,
  Save,
  Download,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { CardSkeleton } from "@/components/ui/skeleton";
import { ExportButton } from "@/components/export-button";
import { CSVImportButton } from "@/components/csv-import";
import { exportCSV } from "@/lib/csv";
import type { Transaction, TransactionItem, Product } from "@prisma/client";

type TxnWithItems = Transaction & { items: TransactionItem[] };

interface Buyer {
  buyerName: string;
  totalOrders: number;
  totalSpent: number;
  buyerAddress?: string | null;
  buyerContact?: string | null;
  lastOrder?: Date | null;
}

export default function BuyersPage() {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [minOrders, setMinOrders] = useState("");
  const [selectedBuyer, setSelectedBuyer] = useState<string | null>(null);
  const [history, setHistory] = useState<TxnWithItems[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedReceipt, setExpandedReceipt] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [showEditBuyer, setShowEditBuyer] = useState(false);
  const [editAddress, setEditAddress] = useState("");
  const [editContact, setEditContact] = useState("");
  const [savingBuyer, setSavingBuyer] = useState(false);
  const perPage = 10;

  useEffect(() => {
    Promise.all([getBuyers(), getProducts({})]).then(([data, prods]) => {
      setBuyers(data as Buyer[]);
      setProducts(prods as Product[]);
      setLoading(false);
    });
  }, []);

  async function selectBuyer(name: string) {
    setSelectedBuyer(name);
    setHistoryLoading(true);
    setExpandedReceipt(null);
    try {
      const data = await getBuyerTransactions(name);
      setHistory(data as TxnWithItems[]);
      if (data.length > 0) {
        setEditAddress(data[0].buyerAddress || "");
        setEditContact(data[0].buyerContact || "");
      }
    } finally {
      setHistoryLoading(false);
    }
  }

  function exportBuyerReport() {
    if (!selectedBuyer) return;
    const totalSpent = history.reduce(
      (s, t) => s + Number(t.grandTotal || 0),
      0,
    );
    const rows: string[][] = [];
    rows.push(["Buyer Report", selectedBuyer]);
    rows.push(["Address", history[0]?.buyerAddress || "—"]);
    rows.push(["Contact", history[0]?.buyerContact || "—"]);
    rows.push([]);
    rows.push(["Receipt #", "Type", "Date", "Total", "Status"]);
    for (const t of history) {
      rows.push([
        `#${t.receiptNumber}`,
        t.transactionType.replace(/([A-Z])/g, " $1").trim(),
        new Date(t.transactionDate).toLocaleDateString("en-PH"),
        `₱${Number(t.grandTotal || 0).toLocaleString()}`,
        t.transactionStatus,
      ]);
    }
    rows.push([]);
    rows.push(["Summary"]);
    rows.push(["Total Orders", String(history.length)]);
    rows.push(["Total Spent", `₱${totalSpent.toLocaleString()}`]);

    const csv =
      "data:text/csv;charset=utf-8," +
      rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = encodeURI(csv);
    a.download = `buyer-report-${selectedBuyer.replace(/\s+/g, "-")}.csv`;
    a.click();
  }

  const filtered = buyers.filter((b) => {
    if (search && !b.buyerName.toLowerCase().includes(search.toLowerCase()))
      return false;
    if (minOrders && b.totalOrders < Number(minOrders)) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  if (loading)
    return (
      <div className="space-y-5">
        <PageHeader title="Buyers" subtitle="Loading..." />
        <CardSkeleton count={6} />
      </div>
    );

  if (selectedBuyer) {
    return (
      <div className="space-y-5">
        <button
          onClick={() => setSelectedBuyer(null)}
          className="flex items-center gap-2 text-sm text-[#64748b] hover:text-[#0e212c] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Buyers
        </button>

        <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#fd761a] to-[#e56600] text-white flex items-center justify-center text-xl font-bold shadow-sm shrink-0">
              {selectedBuyer.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-[#0e212c]">
                {selectedBuyer}
              </h1>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-[#64748b]">
                <span className="flex items-center gap-1.5">
                  <Receipt className="h-3.5 w-3.5" /> {history.length} order
                  {history.length !== 1 ? "s" : ""}
                </span>
                {history[0]?.buyerAddress && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> {history[0].buyerAddress}
                  </span>
                )}
                {history[0]?.buyerContact && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> {history[0].buyerContact}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowEditBuyer(true)}
                title="Edit buyer information"
                className="p-2 text-[#64748b] hover:bg-[#f1f5f9] rounded-lg transition-all text-sm flex items-center gap-1.5"
              >
                <Pencil className="h-4 w-4" /> Edit Info
              </button>
              <button
                onClick={exportBuyerReport}
                title="Export buyer transaction report"
                className="p-2 text-[#64748b] hover:bg-[#f1f5f9] rounded-lg transition-all text-sm flex items-center gap-1.5"
              >
                <Download className="h-4 w-4" /> Export Report
              </button>
              <div className="text-right">
                <p className="text-xs text-[#94a3b8] uppercase tracking-wider font-semibold">
                  Total Spent
                </p>
                <p className="text-xl font-bold text-[#fd761a]">
                  ₱
                  {history
                    .reduce((s, t) => s + Number(t.grandTotal || 0), 0)
                    .toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {historyLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-[#fd761a]" />
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((txn) => {
              const isExpanded = expandedReceipt === txn.id;
              return (
                <div
                  key={txn.id}
                  className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-4 flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        txn.transactionStatus === "Completed"
                          ? "bg-emerald-50 text-emerald-600"
                          : txn.transactionStatus === "Cancelled"
                            ? "bg-rose-50 text-rose-500"
                            : "bg-amber-50 text-amber-600"
                      }`}
                    >
                      <Receipt className="h-4 w-4" />
                    </div>
                    <div className="flex-1 grid grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-[10px] font-semibold text-[#94a3b8] uppercase">
                          Receipt
                        </p>
                        <p className="font-mono text-[#0e212c] font-medium mt-0.5">
                          #{txn.receiptNumber}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-[#94a3b8] uppercase">
                          Type
                        </p>
                        <p className="text-[#0e212c] mt-0.5">
                          {txn.transactionType
                            .replace(/([A-Z])/g, " $1")
                            .trim()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-[#94a3b8] uppercase">
                          Date
                        </p>
                        <p className="text-[#64748b] mt-0.5">
                          {new Date(txn.transactionDate).toLocaleDateString(
                            "en-PH",
                            { month: "short", day: "numeric", year: "numeric" },
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-[#94a3b8] uppercase">
                          Total
                        </p>
                        <p className="font-mono text-[#0e212c] font-semibold mt-0.5">
                          ₱{Number(txn.grandTotal || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                          txn.transactionStatus === "Completed"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : txn.transactionStatus === "Cancelled"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {txn.transactionStatus}
                      </span>
                      <button
                        onClick={() =>
                          setExpandedReceipt(isExpanded ? null : txn.id)
                        }
                        className="p-1.5 text-[#94a3b8] hover:bg-[#f1f5f9] rounded-lg transition-all"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  {isExpanded && (
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
                          {txn.items.map((item) => (
                            <tr key={item.id}>
                              <td className="py-2 text-[#0e212c] font-medium">
                                {products.find((p) => p.id === item.productId)
                                  ?.productName || `#${item.productId}`}
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
                    </div>
                  )}
                </div>
              );
            })}
            {history.length === 0 && (
              <div className="text-center py-12 text-[#94a3b8]">
                No transactions found
              </div>
            )}
          </div>
        )}

        {/* Edit Buyer Info Modal */}
        {showEditBuyer && (
          <div
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center"
            onClick={() => setShowEditBuyer(false)}
          >
            <div
              className="bg-white rounded-xl shadow-2xl border border-[#e2e8f0] w-full max-w-sm mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#e2e8f0]">
                <h2 className="text-lg font-bold text-[#0e212c]">
                  Edit Buyer Info
                </h2>
                <button
                  onClick={() => setShowEditBuyer(false)}
                  className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b] transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                    Address
                  </label>
                  <input
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    placeholder="Enter address"
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                    Contact
                  </label>
                  <input
                    value={editContact}
                    onChange={(e) => setEditContact(e.target.value)}
                    placeholder="Enter contact number"
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a]"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowEditBuyer(false)}
                    className="flex-1 py-2.5 border border-[#e2e8f0] text-sm font-medium text-[#64748b] rounded-lg hover:bg-[#f8fafc] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      setSavingBuyer(true);
                      try {
                        await updateBuyerInfo(selectedBuyer!, {
                          buyerAddress: editAddress,
                          buyerContact: editContact,
                        });
                        setHistory((prev) =>
                          prev.map((t) => ({
                            ...t,
                            buyerAddress: editAddress,
                            buyerContact: editContact,
                          })),
                        );
                        setShowEditBuyer(false);
                      } catch (e) {
                        console.error("Failed to update", e);
                      } finally {
                        setSavingBuyer(false);
                      }
                    }}
                    disabled={savingBuyer}
                    className="flex-1 py-2.5 bg-gradient-to-r from-[#fd761a] to-[#e56600] text-white text-sm font-semibold rounded-lg shadow-lg shadow-[#fd761a]/20 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {savingBuyer ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" /> Save
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Buyers"
        subtitle={`${filtered.length} buyer${filtered.length !== 1 ? "s" : ""} found — view customer purchase histories and contact details.`}
      />
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search buyers..."
            className="w-full pl-9 pr-3 py-2 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a]"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-[#64748b]">
          <span className="text-[10px] font-semibold uppercase">
            Min Orders
          </span>
          <input
            type="number"
            min={0}
            value={minOrders}
            onChange={(e) => {
              setMinOrders(e.target.value);
              setPage(1);
            }}
            placeholder="0"
            className="w-16 px-2 py-2 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a]"
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <ExportButton
            filename={`cwl-hardware-buyers-${new Date().toISOString().slice(0, 10)}.csv`}
            headers={[
              "Buyer Name",
              "Total Orders",
              "Total Spent",
              "Address",
              "Contact",
              "Last Order",
            ]}
            rows={filtered.map((b) => [
              b.buyerName,
              String(b.totalOrders),
              `₱${b.totalSpent.toLocaleString()}`,
              b.buyerAddress || "",
              b.buyerContact || "",
              b.lastOrder
                ? new Date(b.lastOrder).toLocaleDateString("en-PH")
                : "",
            ])}
            label="Export CSV"
            title="Export buyers list"
          />
          <CSVImportButton
            table="buyers"
            onImported={() => window.location.reload()}
            title="Import buyers from CSV"
          />
        </div>
      </div>

      <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                <th className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                  Name
                </th>
                <th className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                  Contact
                </th>
                <th className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                  Address
                </th>
                <th className="text-right p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                  Total Orders
                </th>
                <th className="text-right p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                  Total Spent
                </th>
                <th className="text-right p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                  Last Order
                </th>
                <th className="text-center p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {paged.map((buyer, i) => (
                <tr
                  key={buyer.buyerName}
                  className={`${i % 2 === 0 ? "" : "bg-[#fafbfc]"} hover:bg-[#f1f5f9] transition-colors cursor-pointer`}
                  onClick={() => selectBuyer(buyer.buyerName)}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#0e212c] to-[#1a3a4a] text-white flex items-center justify-center text-sm font-bold shrink-0">
                        {buyer.buyerName.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-[#0e212c]">
                        {buyer.buyerName}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-[#64748b]">
                    {buyer.buyerContact || "—"}
                  </td>
                  <td className="p-4 text-[#64748b] max-w-[200px] truncate">
                    {buyer.buyerAddress || "—"}
                  </td>
                  <td className="p-4 text-right font-medium text-[#0e212c]">
                    {buyer.totalOrders}
                  </td>
                  <td className="p-4 text-right font-mono font-semibold text-[#fd761a]">
                    ₱{buyer.totalSpent.toLocaleString()}
                  </td>
                  <td className="p-4 text-right text-[#64748b]">
                    {buyer.lastOrder
                      ? new Date(buyer.lastOrder).toLocaleDateString("en-PH", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        selectBuyer(buyer.buyerName);
                      }}
                      title="View buyer details and history"
                      className="px-3 py-1.5 text-xs font-medium text-[#fd761a] hover:bg-[#fff5ed] rounded-lg transition-all"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#94a3b8]">
                    <Users className="h-8 w-8 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">No buyers found</p>
                    <p className="text-xs mt-1">
                      Buyers appear after their first transaction
                    </p>
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
    </div>
  );
}
