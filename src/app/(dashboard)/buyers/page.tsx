/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: June 7, 2026
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
  ChevronLeft,
  ChevronRight,
  Phone,
  MapPin,
  Mail,
  Calendar,
  Pencil,
  X,
  Save,
  Download,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/skeleton";
import { ExportDialog } from "@/components/export-dialog";
import { ImportButton } from "@/components/import-button";
import type { Transaction, TransactionItem, Product } from "@prisma/client";
import { toast } from "sonner";

type TxnWithItems = Transaction & {
  items: TransactionItem[];
  buyer?: { email?: string | null } | null;
};

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
  const [buyerType, setBuyerType] = useState<"all" | "WalkIn" | "PO">("all");
  const [history, setHistory] = useState<TxnWithItems[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedReceipt, setExpandedReceipt] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [showEditBuyer, setShowEditBuyer] = useState(false);
  const [editAddress, setEditAddress] = useState("");
  const [editContact, setEditContact] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [savingBuyer, setSavingBuyer] = useState(false);
  const [perPage, setPerPage] = useState(10);
  const [detailPage, setDetailPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getBuyers(buyerType === "all" ? undefined : buyerType),
      getProducts({}),
    ]).then(([data, prods]) => {
      setBuyers(data as Buyer[]);
      setProducts(prods as Product[]);
      setLoading(false);
      setPage(1);
    });
  }, [buyerType]);

  async function selectBuyer(name: string) {
    setSelectedBuyer(name);
    setHistoryLoading(true);
    setExpandedReceipt(null);
    setDetailPage(1);
    try {
      const data = await getBuyerTransactions(name);
      setHistory(data as TxnWithItems[]);
      if (data.length > 0) {
        setEditAddress(data[0].buyerAddress || "");
        setEditContact(data[0].buyerContact || "");
        setEditEmail((data[0] as any).buyer?.email || "");
      }
    } finally {
      setHistoryLoading(false);
    }
  }

  const [showExportDropdown, setShowExportDropdown] = useState(false);

  function exportBuyerReport(format: "csv" | "xlsx" | "pdf") {
    if (!selectedBuyer) return;
    setShowExportDropdown(false);
    const totalSpent = history.reduce(
      (s, t) => s + Number(t.grandTotal || 0),
      0,
    );
    const headers = ["Receipt #", "Type", "Date", "Total", "Status"];
    const dataRows = history.map((t) => [
      `#${t.receiptNumber}`,
      t.transactionType.replace(/([A-Z])/g, " $1").trim(),
      new Date(t.transactionDate).toLocaleDateString("en-PH"),
      `${Number(t.grandTotal || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      t.transactionStatus,
    ]);
    const metaRows = [
      [`Buyer Report: ${selectedBuyer}`],
      [`Address: ${history[0]?.buyerAddress || "—"}`],
      [`Contact: ${history[0]?.buyerContact || "—"}`],
      [],
    ];
    const summaryRows = [
      [],
      ["Summary"],
      [`Total Orders,${history.length}`],
      [
        `Total Spent,${totalSpent.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      ],
    ];
    const allHeaders = ["Receipt #", "Type", "Date", "Total", "Status"];
    const allRows = [...metaRows, allHeaders, ...dataRows, ...summaryRows];

    if (format === "csv") {
      const csv =
        "data:text/csv;charset=utf-8," +
        allRows
          .map((r) => `"${(Array.isArray(r) ? r : [r]).join('","')}"`)
          .join("\n");
      const a = document.createElement("a");
      a.href = encodeURI(csv);
      a.download = `buyer-report-${selectedBuyer.replace(/\s+/g, "-")}.csv`;
      a.click();
    } else if (format === "xlsx") {
      import("@/lib/csv").then((m) =>
        m.exportXLSX(
          `buyer-report-${selectedBuyer.replace(/\s+/g, "-")}.xlsx`,
          allHeaders,
          dataRows,
        ),
      );
    } else {
      import("@/lib/csv").then((m) =>
        m.exportPDF(
          `buyer-report-${selectedBuyer.replace(/\s+/g, "-")}.pdf`,
          allHeaders,
          dataRows,
        ),
      );
    }
  }

  const filtered = buyers.filter((b) => {
    if (search && !b.buyerName.toLowerCase().includes(search.toLowerCase()))
      return false;
    if (minOrders && b.totalOrders < Number(minOrders)) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const detailPerPage = 5;
  const detailTotalPages = Math.ceil(history.length / detailPerPage);
  const detailPaged = history.slice(
    (detailPage - 1) * detailPerPage,
    detailPage * detailPerPage,
  );

  if (loading)
    return (
      <div className="space-y-5">
        <PageHeader title="Buyers" subtitle="Loading..." />
        <TableSkeleton rows={6} cols={5} />
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
                {history[0]?.buyer?.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> {history[0].buyer.email}
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
              <div className="relative">
                <button
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  title="Export buyer transaction report"
                  className="p-2 text-[#64748b] hover:bg-[#f1f5f9] rounded-lg transition-all text-sm flex items-center gap-1.5"
                >
                  <Download className="h-4 w-4" /> Export Report
                </button>
                {showExportDropdown && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-[#e2e8f0] rounded-lg shadow-xl z-50 min-w-[140px] py-1">
                    <button
                      onClick={() => exportBuyerReport("csv")}
                      className="w-full px-4 py-2 text-left text-sm text-[#0e212c] hover:bg-[#f8fafc] transition-colors flex items-center gap-2"
                    >
                      <Download className="h-3.5 w-3.5 text-[#94a3b8]" /> CSV
                    </button>
                    <button
                      onClick={() => exportBuyerReport("xlsx")}
                      className="w-full px-4 py-2 text-left text-sm text-[#0e212c] hover:bg-[#f8fafc] transition-colors flex items-center gap-2"
                    >
                      <Download className="h-3.5 w-3.5 text-[#94a3b8]" /> XLSX
                    </button>
                    <button
                      onClick={() => exportBuyerReport("pdf")}
                      className="w-full px-4 py-2 text-left text-sm text-[#0e212c] hover:bg-[#f8fafc] transition-colors flex items-center gap-2"
                    >
                      <Download className="h-3.5 w-3.5 text-[#94a3b8]" /> PDF
                    </button>
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-[#94a3b8] uppercase tracking-wider font-semibold">
                  Total Spent
                </p>
                <p className="text-xl font-bold text-[#fd761a]">
                  {history
                    .reduce((s, t) => s + Number(t.grandTotal || 0), 0)
                    .toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
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
            {detailPaged.map((txn) => {
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
                          {Number(txn.grandTotal || 0).toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
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
                                {Number(item.unitPrice).toLocaleString(
                                  "en-PH",
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  },
                                )}
                              </td>
                              <td className="py-2 text-right font-mono text-[#0e212c] font-semibold">
                                {Number(item.totalPrice).toLocaleString(
                                  "en-PH",
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  },
                                )}
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
            {detailTotalPages > 1 && (
              <div className="flex items-center justify-between pt-3 border-t border-[#e2e8f0]">
                <span className="text-xs text-[#64748b]">
                  Page {detailPage} of {detailTotalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDetailPage(Math.max(1, detailPage - 1))}
                    disabled={detailPage === 1}
                    className="px-3 py-1.5 border border-[#e2e8f0] rounded-lg text-xs text-[#64748b] hover:bg-white disabled:opacity-50 transition-all"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() =>
                      setDetailPage(Math.min(detailTotalPages, detailPage + 1))
                    }
                    disabled={detailPage === detailTotalPages}
                    className="px-3 py-1.5 border border-[#e2e8f0] rounded-lg text-xs text-[#64748b] hover:bg-white disabled:opacity-50 transition-all"
                  >
                    Next
                  </button>
                </div>
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
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                    Email
                  </label>
                  <input
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="Enter email address"
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
                          buyerEmail: editEmail,
                        });
                        setHistory((prev) =>
                          prev.map((t) => ({
                            ...t,
                            buyerAddress: editAddress,
                            buyerContact: editContact,
                          })),
                        );
                        setShowEditBuyer(false);
                        toast.success("Buyer info updated successfully");
                      } catch (e) {
                        toast.error("Failed to update buyer info");
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
            placeholder="Search buyers..."
            className="w-full pl-10 pr-4 py-2.5 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10"
          />
        </div>
        <div className="flex items-center gap-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-1">
          {(["all", "WalkIn", "PO"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setBuyerType(t)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                buyerType === t
                  ? "bg-[#fd761a] text-white shadow-sm"
                  : "text-[#64748b] hover:text-[#0e212c]"
              }`}
            >
              {t === "all" ? "All" : t === "WalkIn" ? "Walk-In" : "P.O."}
            </button>
          ))}
        </div>
        <div className="flex gap-2 w-full lg:w-auto flex-wrap items-center">
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
              className="w-16 px-2 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a]"
            />
          </div>
          <ExportDialog
            filename={`cwl-hardware-buyers-${new Date().toISOString().slice(0, 10)}.csv`}
            allColumns={[
              { key: "buyerName", label: "Buyer Name" },
              { key: "totalOrders", label: "Total Orders" },
              { key: "totalSpent", label: "Total Spent" },
              { key: "buyerAddress", label: "Address" },
              { key: "buyerContact", label: "Contact" },
              { key: "lastOrder", label: "Last Order" },
            ]}
            fetchRows={async (selectedColumns) =>
              filtered.map((b) =>
                selectedColumns.map((key) => {
                  if (key === "buyerName") return b.buyerName;
                  if (key === "totalOrders") return String(b.totalOrders);
                  if (key === "totalSpent")
                    return `${b.totalSpent.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                  if (key === "buyerAddress") return b.buyerAddress || "";
                  if (key === "buyerContact") return b.buyerContact || "";
                  if (key === "lastOrder")
                    return b.lastOrder
                      ? new Date(b.lastOrder).toLocaleDateString("en-PH")
                      : "";
                  return "";
                }),
              )
            }
            label="Export"
            title="Export buyers list"
          />
          <ImportButton
            table="buyers"
            onImported={() => window.location.reload()}
            title="Import buyers from CSV or XLSX"
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
                    {buyer.totalSpent.toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
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
        <div className="border-t border-[#e2e8f0] p-4 flex items-center justify-between text-sm text-[#64748b]">
          <span>
            Showing {paged.length} of {filtered.length} items
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-md text-[#64748b] hover:bg-[#f1f5f9] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {(() => {
                const pages: React.ReactNode[] = [];
                if (totalPages <= 7) {
                  for (let i = 1; i <= totalPages; i++) {
                    pages.push(
                      <button
                        key={i}
                        onClick={() => setPage(i)}
                        className={`min-w-[28px] h-7 text-xs font-semibold rounded-md transition-all ${i === page ? "bg-[#fd761a] text-white shadow-sm" : "text-[#64748b] hover:bg-[#f1f5f9]"}`}
                      >
                        {i}
                      </button>,
                    );
                  }
                } else {
                  let start = Math.max(1, page - 3);
                  let end = Math.min(totalPages, page + 3);
                  if (start > 1)
                    pages.push(
                      <span key="s" className="px-1 text-[#94a3b8] text-xs">
                        ...
                      </span>,
                    );
                  for (let i = start; i <= end; i++) {
                    pages.push(
                      <button
                        key={i}
                        onClick={() => setPage(i)}
                        className={`min-w-[28px] h-7 text-xs font-semibold rounded-md transition-all ${i === page ? "bg-[#fd761a] text-white shadow-sm" : "text-[#64748b] hover:bg-[#f1f5f9]"}`}
                      >
                        {i}
                      </button>,
                    );
                  }
                  if (end < totalPages)
                    pages.push(
                      <span key="e" className="px-1 text-[#94a3b8] text-xs">
                        ...
                      </span>,
                    );
                }
                return pages;
              })()}
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-md text-[#64748b] hover:bg-[#f1f5f9] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setPage(1);
                }}
                className="ml-2 px-2 py-1.5 border border-[#e2e8f0] rounded text-xs text-[#64748b] bg-white"
              >
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
