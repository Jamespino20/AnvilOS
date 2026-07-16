/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: July 16, 2026
*/

"use client";

import { useState, useEffect } from "react";
import {
  getTransactions,
  getTransactionsCount,
  updateTransactionStatus,
  updateTransactionInvoice,
  markCreditAsPaid,
  toggleTransactionCredit,
  getProducts,
} from "@/actions";
import { callAction } from "@/lib/client-action";
import {
  Search,
  Receipt,
  Loader2,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Package,
  Truck,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { getDateScopeStart, getDateScopeEnd, DATE_SCOPES } from "@/lib/format";
import { TableSkeleton } from "@/components/ui/skeleton";
import { ExportDialog } from "@/components/export-dialog";
import { downloadReceiptPdf } from "@/lib/receipt";

import type { Transaction, TransactionItem, Product } from "@prisma/client";
import { toast } from "sonner";

type TxnWithItems = Transaction & { items: TransactionItem[] };

const STATUS_OPTIONS = [
  "",
  "Completed",
  "Ongoing",
  "Processing",
  "OnTheWay",
  "Cancelled",
];
const TYPE_OPTIONS = [
  "",
  "SaleWalkIn",
  "SalePO",
  "Return",
  "Restock",
  "Damage",
  "Adjustment",
];

function statusBadge(status: string) {
  const map: Record<string, string> = {
    Completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    Ongoing: "bg-amber-50 text-amber-700 border border-amber-200",
    Processing: "bg-sky-50 text-sky-700 border border-sky-200",
    OnTheWay: "bg-violet-50 text-violet-700 border border-violet-200",
    Cancelled: "bg-rose-50 text-rose-700 border border-rose-200",
  };
  return map[status] || "bg-[#f8fafc] text-[#64748b] border border-[#e2e8f0]";
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TxnWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [sortBy, setSortBy] = useState<string>("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [editingInvoice, setEditingInvoice] = useState<{
    id: number;
    field: "salesInvoiceNumber" | "deliveryReceiptNumber";
    value: string;
  } | null>(null);
  const [dateScope, setDateScope] = useState("today");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [initialLoad, setInitialLoad] = useState(true);
  const perPage = 15;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Load products once (not affected by sort/filter)
  useEffect(() => {
    getProducts({}).then((prods) => setProducts(prods as Product[]));
  }, []);

  useEffect(() => {
    setLoading(true);
    const startDate = getDateScopeStart(dateScope);
    const endDate = getDateScopeEnd(dateScope);
    Promise.all([
      getTransactions({
        status: statusFilter || undefined,
        type: typeFilter || undefined,
        paymentMethod: paymentFilter || undefined,
        search: search || undefined,
        startDate,
        endDate,
        page,
        perPage,
        sortBy: sortBy || undefined,
        sortDir,
      }),
      getTransactionsCount({
        status: statusFilter || undefined,
        type: typeFilter || undefined,
        paymentMethod: paymentFilter || undefined,
        search: search || undefined,
        startDate,
        endDate,
      }),
    ])
      .then(([data, count]) => {
        setTransactions(data as TxnWithItems[]);
        setTotal(count);
        setLoading(false);
        setInitialLoad(false);
      })
      .catch(() => {
        setLoading(false);
        setInitialLoad(false);
      });
  }, [
    statusFilter,
    typeFilter,
    paymentFilter,
    search,
    page,
    dateScope,
    sortBy,
    sortDir,
  ]);

  async function quickStatusChange(
    id: number,
    status: "Ongoing" | "Processing" | "OnTheWay" | "Completed" | "Cancelled",
  ) {
    try {
      await updateTransactionStatus(id, status);
      toast.success("Status updated to " + status);
      const startDate = getDateScopeStart(dateScope);
      const endDate = getDateScopeEnd(dateScope);
      const [data, count] = await Promise.all([
        getTransactions({
          status: statusFilter || undefined,
          type: typeFilter || undefined,
          paymentMethod: paymentFilter || undefined,
          search: search || undefined,
          startDate,
          endDate,
          page,
          perPage,
          sortBy: sortBy || undefined,
          sortDir,
        }),
        getTransactionsCount({
          status: statusFilter || undefined,
          type: typeFilter || undefined,
          paymentMethod: paymentFilter || undefined,
          search: search || undefined,
          startDate,
          endDate,
        }),
      ]);
      setTransactions(data as TxnWithItems[]);
      setTotal(count);
    } catch (e: any) {
      toast.error(e.message || "Failed to update status");
    }
  }

  const totalPages = Math.ceil(total / perPage);

  function renderInvoiceCell(
    t: TxnWithItems,
    field: "salesInvoiceNumber" | "deliveryReceiptNumber",
    value: string | null,
  ) {
    const isEditing =
      editingInvoice?.id === t.id && editingInvoice?.field === field;
    return (
      <td
        className="p-4 text-sm text-[#0e212c] cursor-pointer"
        onClick={(e) => {
          if (!isEditing) {
            e.stopPropagation();
            setEditingInvoice({ id: t.id, field, value: value || "" });
          }
        }}
      >
        {isEditing ? (
          <input
            type="text"
            value={editingInvoice!.value}
            autoFocus
            onClick={(e) => e.stopPropagation()}
            onChange={(e) =>
              setEditingInvoice({ ...editingInvoice!, value: e.target.value })
            }
            onBlur={() => {
              updateTransactionInvoice(
                editingInvoice!.id,
                field,
                editingInvoice!.value,
              );
              setTransactions((prev) =>
                prev.map((txn) =>
                  txn.id === editingInvoice!.id
                    ? { ...txn, [field]: editingInvoice!.value }
                    : txn,
                ),
              );
              setEditingInvoice(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              if (e.key === "Escape") setEditingInvoice(null);
            }}
            className="w-full max-w-[160px] px-2 py-1 text-xs border border-[#fd761a] rounded focus:outline-none"
          />
        ) : (
          <span className="text-[#64748b]">{value || "—"}</span>
        )}
      </td>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Transactions"
        subtitle="View and manage all sales, returns, restocks, and adjustments."
      />

      <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 flex flex-col lg:flex-row flex-wrap gap-3 items-center">
        <div className="relative w-full lg:flex-1 lg:min-w-[240px] min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search receipt #, invoice, buyer..."
            className="w-full h-10 pl-10 pr-4 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10"
          />
        </div>
        <div className="flex gap-2 w-full lg:w-auto flex-wrap items-center">
          <div className="flex items-center gap-1 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-1 flex-wrap">
            {DATE_SCOPES.map((s) => (
              <button
                key={s.value}
                onClick={() => {
                  setDateScope(s.value);
                  setPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${dateScope === s.value ? "bg-[#fd761a] text-white shadow-sm" : "text-[#64748b] hover:text-[#0e212c]"}`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 px-3 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a] w-full lg:w-auto min-w-0"
          >
            <option value="">All Types</option>
            {TYPE_OPTIONS.slice(1).map((t) => (
              <option key={t} value={t}>
                {t.replace(/([A-Z])/g, " $1").trim()}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 px-3 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a] w-full lg:w-auto min-w-0"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.slice(1).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 px-3 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a] w-full lg:w-auto min-w-0"
          >
            <option value="">All Payments</option>
            <option value="Cash">Cash</option>
            <option value="Credit">Credit</option>
          </select>
        </div>
        <div className="flex gap-2 w-full lg:w-auto flex-wrap">
          <ExportDialog
            filename={`cwl-hardware-transactions${dateScope !== "all" ? `-${getDateScopeStart(dateScope) || ""}` : ""}-${new Date().toISOString().slice(0, 10)}.csv`}
            allColumns={[
              { key: "receiptNumber", label: "Receipt #" },
              { key: "salesInvoiceNumber", label: "Sales Inv #" },
              { key: "deliveryReceiptNumber", label: "Delivery Rcpt #" },
              { key: "buyerName", label: "Buyer" },
              { key: "transactionType", label: "Type" },
              { key: "transactionDate", label: "Date" },
              { key: "paymentMethod", label: "Payment" },
              { key: "grandTotal", label: "Total" },
              { key: "transactionStatus", label: "Status" },
              { key: "sellerName", label: "Seller" },
              { key: "isCredit", label: "Credit" },
              { key: "creditDueDate", label: "Credit Due" },
              { key: "creditPaidAt", label: "Credit Paid" },
            ]}
            fetchRows={async (selectedColumns) =>
              transactions.map((t) =>
                selectedColumns.map((key) => {
                  if (key === "receiptNumber") return String(t.receiptNumber);
                  if (key === "salesInvoiceNumber")
                    return (t as any).salesInvoiceNumber || "";
                  if (key === "deliveryReceiptNumber")
                    return (t as any).deliveryReceiptNumber || "";
                  if (key === "buyerName") return t.buyerName;
                  if (key === "transactionType")
                    return t.transactionType.replace(/([A-Z])/g, " $1").trim();
                  if (key === "transactionDate")
                    return new Date(t.transactionDate).toLocaleDateString(
                      "en-PH",
                    );
                  if (key === "paymentMethod") return t.paymentMethod || "—";
                  if (key === "grandTotal")
                    return `${Number(t.grandTotal || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                  if (key === "transactionStatus") return t.transactionStatus;
                  if (key === "sellerName") return t.sellerName || "—";
                  if (key === "isCredit") return t.isCredit ? "Yes" : "No";
                  if (key === "creditDueDate")
                    return t.creditDueDate
                      ? new Date(t.creditDueDate).toLocaleDateString("en-PH")
                      : "";
                  if (key === "creditPaidAt")
                    return t.creditPaidAt
                      ? new Date(t.creditPaidAt).toLocaleDateString("en-PH")
                      : "";
                  return "";
                }),
              )
            }
            label="Export"
            title="Export transactions"
            filterLabel={
              dateScope !== "all"
                ? DATE_SCOPES.find((s) => s.value === dateScope)?.label ||
                  dateScope
                : undefined
            }
          />
        </div>
      </div>

      <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden relative group">
        {loading && !initialLoad && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-20 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#fd761a]" />
          </div>
        )}
        {initialLoad ? (
          <TableSkeleton rows={10} cols={10} />
        ) : (
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-sm min-w-[800px] lg:min-w-0">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                  <th
                    className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider cursor-pointer select-none hover:text-[#fd761a] transition-colors"
                    onClick={() => {
                      if (sortBy === "receiptNumber") {
                        setSortDir(sortDir === "asc" ? "desc" : "asc");
                      } else {
                        setSortBy("receiptNumber");
                        setSortDir("desc");
                      }
                    }}
                  >
                    Receipt #
                    <span
                      className={`ml-1 ${sortBy === "receiptNumber" ? "text-[#fd761a]" : "text-[#cbd5e1]"}`}
                    >
                      {sortBy === "receiptNumber" && sortDir === "asc"
                        ? "\u25B2"
                        : sortBy === "receiptNumber" && sortDir === "desc"
                          ? "\u25BC"
                          : "\u25B2"}
                    </span>
                  </th>
                  <th
                    className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider cursor-pointer select-none hover:text-[#fd761a] transition-colors"
                    onClick={() => {
                      if (sortBy === "salesInvoiceNumber") {
                        setSortDir(sortDir === "asc" ? "desc" : "asc");
                      } else {
                        setSortBy("salesInvoiceNumber");
                        setSortDir("desc");
                      }
                    }}
                  >
                    Sales Inv #
                    <span
                      className={`ml-1 ${sortBy === "salesInvoiceNumber" ? "text-[#fd761a]" : "text-[#cbd5e1]"}`}
                    >
                      {sortBy === "salesInvoiceNumber" && sortDir === "asc"
                        ? "\u25B2"
                        : sortBy === "salesInvoiceNumber" && sortDir === "desc"
                          ? "\u25BC"
                          : "\u25B2"}
                    </span>
                  </th>
                  <th
                    className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider cursor-pointer select-none hover:text-[#fd761a] transition-colors"
                    onClick={() => {
                      if (sortBy === "deliveryReceiptNumber") {
                        setSortDir(sortDir === "asc" ? "desc" : "asc");
                      } else {
                        setSortBy("deliveryReceiptNumber");
                        setSortDir("desc");
                      }
                    }}
                  >
                    Delivery Rcpt #
                    <span
                      className={`ml-1 ${sortBy === "deliveryReceiptNumber" ? "text-[#fd761a]" : "text-[#cbd5e1]"}`}
                    >
                      {sortBy === "deliveryReceiptNumber" && sortDir === "asc"
                        ? "\u25B2"
                        : sortBy === "deliveryReceiptNumber" &&
                            sortDir === "desc"
                          ? "\u25BC"
                          : "\u25B2"}
                    </span>
                  </th>
                  <th className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                    Buyer
                  </th>
                  <th className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                    Type
                  </th>
                  <th className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="text-right p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                    Total
                  </th>
                  <th className="text-center p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-center p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {transactions.map((t, i) => (
                  <>
                    <tr
                      key={t.id}
                      className={`${i % 2 === 0 ? "" : "bg-[#fafbfc]"} hover:bg-[#f1f5f9] transition-colors cursor-pointer`}
                      onClick={() =>
                        setExpandedId(expandedId === t.id ? null : t.id)
                      }
                    >
                      <td className="p-4 font-mono text-sm text-[#0e212c]">
                        #{t.receiptNumber}
                      </td>
                      {renderInvoiceCell(
                        t,
                        "salesInvoiceNumber",
                        (t as any).salesInvoiceNumber || null,
                      )}
                      {renderInvoiceCell(
                        t,
                        "deliveryReceiptNumber",
                        (t as any).deliveryReceiptNumber || null,
                      )}
                      <td className="p-4 font-medium text-[#0e212c]">
                        {t.buyerName}
                      </td>
                      <td className="p-4 text-[#64748b]">
                        {(t as any).seller?.sellerName || "\u2014"}
                      </td>
                      <td className="p-4 text-[#64748b]">
                        {t.transactionType.replace(/([A-Z])/g, " $1").trim()}
                      </td>
                      <td className="p-4 text-[#64748b]">
                        {new Date(t.transactionDate).toLocaleDateString(
                          "en-PH",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </td>
                      <td className="p-4 text-[#64748b]">
                        <div className="flex items-center gap-2">
                          <span>{t.paymentMethod || "\u2014"}</span>
                          {(t as any).isCredit && (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                (t as any).creditPaidAt
                                  ? "bg-green-100 text-green-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {(t as any).creditPaidAt ? "Paid" : "Unpaid"}
                              {(t as any).creditDueDate && (
                                <span className="text-[9px] opacity-70">
                                  Due:{" "}
                                  {new Date(
                                    (t as any).creditDueDate,
                                  ).toLocaleDateString("en-PH")}
                                </span>
                              )}
                            </span>
                          )}
                          {(t as any).isCredit && !(t as any).creditPaidAt && (
                            <button
                              onClick={async () => {
                                try {
                                  await callAction(markCreditAsPaid(t.id));
                                  toast.success("Credit marked as paid");
                                  window.location.reload();
                                } catch (e: any) {
                                  toast.error(
                                    e.message ||
                                      "Failed to mark credit as paid",
                                  );
                                }
                              }}
                              className="px-2 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              Mark Paid
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right font-mono text-[#0e212c] font-semibold">
                        {Number(t.grandTotal || 0).toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-sm text-[#64748b]">
                          {t.transactionStatus}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {t.transactionStatus === "Ongoing" && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  quickStatusChange(t.id, "Processing");
                                }}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-md transition-all"
                                title="Mark as Processing"
                              >
                                <Package className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  quickStatusChange(t.id, "Cancelled");
                                }}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition-all"
                                title="Cancel transaction"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                          {t.transactionStatus === "Processing" && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  quickStatusChange(t.id, "OnTheWay");
                                }}
                                className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-md transition-all"
                                title="Mark as On the Way"
                              >
                                <Truck className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  quickStatusChange(t.id, "Cancelled");
                                }}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition-all"
                                title="Cancel transaction"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                          {t.transactionStatus === "OnTheWay" && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  quickStatusChange(t.id, "Completed");
                                }}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-all"
                                title="Mark as completed"
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  quickStatusChange(t.id, "Cancelled");
                                }}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition-all"
                                title="Cancel transaction"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                          {(t.transactionStatus === "Completed" ||
                            t.transactionStatus === "Cancelled") && (
                            <span className="w-7" />
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const items = t.items.map((i) => ({
                                productName: i.productName || `#${i.productId}`,
                                quantity: i.quantity || 0,
                                unitPrice: Number(i.unitPrice || 0),
                                totalPrice: Number(i.totalPrice || 0),
                              }));
                              downloadReceiptPdf({
                                receiptNumber: t.receiptNumber,
                                date: new Date(t.transactionDate),
                                sellerName: t.sellerName || "Unknown",
                                buyerName: t.buyerName,
                                buyerAddress: t.buyerAddress || undefined,
                                buyerContact: t.buyerContact || undefined,
                                items,
                                grandTotal: Number(t.grandTotal || 0),
                                paymentMethod: t.paymentMethod || undefined,
                                transactionType: t.transactionType,
                                salesInvoiceNumber:
                                  (t as any).salesInvoiceNumber || undefined,
                                deliveryReceiptNumber:
                                  (t as any).deliveryReceiptNumber || undefined,
                                tin: (t as any).tin || undefined,
                                isCredit: t.isCredit || undefined,
                                creditDueDate: t.creditDueDate || undefined,
                                chequeDetails:
                                  (t as any).chequeNumber
                                    ? {
                                        chequeNumber:
                                          (t as any).chequeNumber || undefined,
                                        bankName:
                                          (t as any).chequeBankName ||
                                          undefined,
                                        chequeDate:
                                          (t as any).chequeDate || undefined,
                                        payeeName:
                                          (t as any).chequePayeeName ||
                                          undefined,
                                      }
                                    : undefined,
                                discountType:
                                  (t as any).discountType || undefined,
                                discountValue:
                                  (t as any).discountValue ?? undefined,
                              });
                            }}
                            className="p-1.5 text-[#94a3b8] hover:text-[#fd761a] hover:bg-amber-50 rounded-md transition-all"
                            title="Download receipt"
                          >
                            <Receipt className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedId(expandedId === t.id ? null : t.id);
                            }}
                            className="p-1.5 text-[#94a3b8] hover:bg-[#f1f5f9] rounded-md transition-all"
                          >
                            {expandedId === t.id ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  </>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-[#94a3b8]">
                      No transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="border-t border-[#e2e8f0] p-4 flex items-center justify-between text-sm text-[#64748b]">
        <span>
          Showing {transactions.length} of {total} items
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
          </div>
        )}
      </div>

      {/* Transaction Detail Modal */}
      {expandedId &&
        (() => {
          const t = transactions.find((tx) => tx.id === expandedId);
          if (!t) return null;
          return (
            <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
              <div
                className="bg-white rounded-xl shadow-2xl border border-[#e2e8f0] w-full max-w-2xl max-h-[85vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#e2e8f0] shrink-0">
                  <div>
                    <h2 className="text-lg font-bold text-[#0e212c]">
                      Transaction #{t.receiptNumber}
                    </h2>
                    <p className="text-xs text-[#64748b] mt-0.5">
                      {new Date(t.transactionDate).toLocaleDateString("en-PH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => setExpandedId(null)}
                    className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b] transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                  {/* Header Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">
                        Buyer
                      </span>
                      <p className="text-[#0e212c] font-medium">
                        {t.buyerName}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">
                        Seller
                      </span>
                      <p className="text-[#0e212c] font-medium">
                        {(t as any).seller?.sellerName || "\u2014"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">
                        Type
                      </span>
                      <p className="text-[#0e212c] font-medium">
                        {t.transactionType}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">
                        Status
                      </span>
                      <p className="text-[#0e212c] font-medium">
                        {t.transactionStatus}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">
                        Delivery
                      </span>
                      <p className="text-[#0e212c] font-medium">
                        {t.deliveryMethod}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">
                        Payment
                      </span>
                      <p className="text-[#0e212c] font-medium">
                        {t.paymentMethod || "\u2014"}
                      </p>
                    </div>
                    {(t as any).salesInvoiceNumber && (
                      <div>
                        <span className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">
                          Sales Invoice #
                        </span>
                        <p className="text-[#0e212c] font-medium">
                          {(t as any).salesInvoiceNumber}
                        </p>
                      </div>
                    )}
                    {(t as any).deliveryReceiptNumber && (
                      <div>
                        <span className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">
                          Delivery Receipt #
                        </span>
                        <p className="text-[#0e212c] font-medium">
                          {(t as any).deliveryReceiptNumber}
                        </p>
                      </div>
                    )}
                    {(t as any).tin && (
                      <div>
                        <span className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">
                          TIN
                        </span>
                        <p className="text-[#0e212c] font-medium">
                          {(t as any).tin}
                        </p>
                      </div>
                    )}
                    {t.returnForReceiptNumber && (
                      <div>
                        <span className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">
                          {t.transactionType === "Return"
                            ? "Return of"
                            : t.transactionType === "Damage"
                              ? "Damage ref"
                              : "Adjustment ref"}
                        </span>
                        <p className="text-[#0e212c] font-medium">
                          #{t.returnForReceiptNumber}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Credit Info */}
                  <div className="border border-[#e2e8f0] rounded-lg p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-semibold text-[#0e212c]">
                          Credit Sale
                        </span>
                        {(t as any).isCredit ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-700">
                            {(t as any).creditPaidAt ? "Paid" : "Unpaid"}
                            {(t as any).creditDueDate && (
                              <span className="text-[9px] opacity-70">
                                Due:{" "}
                                {new Date(
                                  (t as any).creditDueDate,
                                ).toLocaleDateString("en-PH")}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#94a3b8]">
                            Not a credit sale
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {(t as any).isCredit && !(t as any).creditPaidAt && (
                          <button
                            onClick={async () => {
                              try {
                                await callAction(markCreditAsPaid(t.id));
                                toast.success("Credit marked as paid");
                                window.location.reload();
                              } catch (e: any) {
                                toast.error(
                                  e.message || "Failed to mark credit as paid",
                                );
                              }
                            }}
                            className="px-2 py-1 text-[10px] font-bold bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Mark Paid
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            try {
                              const newIsCredit = !(t as any).isCredit;
                              await callAction(
                                toggleTransactionCredit(
                                  t.id,
                                  newIsCredit,
                                  newIsCredit ? null : undefined,
                                ),
                              );
                              toast.success(
                                newIsCredit
                                  ? "Marked as credit sale"
                                  : "Credit removed",
                              );
                              window.location.reload();
                            } catch (e: any) {
                              toast.error(
                                e.message || "Failed to update credit",
                              );
                            }
                          }}
                          className={`px-2 py-1 text-[10px] font-bold rounded ${
                            (t as any).isCredit
                              ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                              : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                          }`}
                        >
                          {(t as any).isCredit
                            ? "Remove Credit"
                            : "Mark as Credit"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Cheque Details */}
                  {(t as any).chequeNumber && (
                    <div className="border border-[#e2e8f0] rounded-lg p-4 space-y-2 bg-[#f8fafc]">
                      <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">
                        Cheque Details
                      </p>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        <div>
                          <span className="text-[10px] text-[#94a3b8]">
                            Cheque/Ref #
                          </span>
                          <p className="text-[#0e212c] font-medium">
                            {(t as any).chequeNumber}
                          </p>
                        </div>
                        {(t as any).chequeBankName && (
                          <div>
                            <span className="text-[10px] text-[#94a3b8]">
                              Bank Name
                            </span>
                            <p className="text-[#0e212c] font-medium">
                              {(t as any).chequeBankName}
                            </p>
                          </div>
                        )}
                        {(t as any).chequeDate && (
                          <div>
                            <span className="text-[10px] text-[#94a3b8]">
                              Cheque Date
                            </span>
                            <p className="text-[#0e212c] font-medium">
                              {new Date(
                                (t as any).chequeDate,
                              ).toLocaleDateString("en-PH")}
                            </p>
                          </div>
                        )}
                        {(t as any).chequePayeeName && (
                          <div>
                            <span className="text-[10px] text-[#94a3b8]">
                              Payee Name
                            </span>
                            <p className="text-[#0e212c] font-medium">
                              {(t as any).chequePayeeName}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Items Table */}
                  <div>
                    <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-2">
                      Items
                    </p>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                          <th className="text-left p-3 text-[10px] font-semibold text-[#64748b] uppercase">
                            Product
                          </th>
                          <th className="text-right p-3 text-[10px] font-semibold text-[#64748b] uppercase">
                            Qty
                          </th>
                          <th className="text-right p-3 text-[10px] font-semibold text-[#64748b] uppercase">
                            Price
                          </th>
                          <th className="text-right p-3 text-[10px] font-semibold text-[#64748b] uppercase">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e2e8f0]">
                        {t.items.map((item) => (
                          <tr key={item.id}>
                            <td className="p-3 text-[#0e212c] font-medium">
                              {item.productName ||
                                products.find((p) => p.id === item.productId)
                                  ?.productName ||
                                `#${item.productId}`}
                            </td>
                            <td className="p-3 text-right text-[#64748b]">
                              {item.quantity}
                            </td>
                            <td className="p-3 text-right font-mono text-[#64748b]">
                              {Number(item.unitPrice).toLocaleString("en-PH", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="p-3 text-right font-mono text-[#0e212c] font-semibold">
                              {Number(item.totalPrice).toLocaleString("en-PH", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="flex justify-end mt-3 pt-3 border-t border-[#e2e8f0]">
                      <div className="text-right space-y-1">
                        {(t as any).discountType &&
                          (t as any).discountValue > 0 && (
                            <>
                              <div className="flex justify-end gap-4 text-xs text-[#64748b]">
                                <span>Subtotal</span>
                                <span className="font-mono">
                                  {(() => {
                                    const subtotal = t.items.reduce(
                                      (sum, i) =>
                                        sum + Number(i.totalPrice || 0),
                                      0,
                                    );
                                    return subtotal.toLocaleString("en-PH", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    });
                                  })()}
                                </span>
                              </div>
                              <div className="flex justify-end gap-4 text-xs text-red-500">
                                <span>
                                  Discount{" "}
                                  {(t as any).discountType === "percent"
                                    ? `(${(t as any).discountValue}%)`
                                    : ""}
                                </span>
                                <span className="font-mono">
                                  -
                                  {(() => {
                                    const subtotal = t.items.reduce(
                                      (sum, i) =>
                                        sum + Number(i.totalPrice || 0),
                                      0,
                                    );
                                    const disc =
                                      (t as any).discountType === "percent"
                                        ? subtotal *
                                          ((t as any).discountValue / 100)
                                        : (t as any).discountValue;
                                    return disc.toLocaleString("en-PH", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    });
                                  })()}
                                </span>
                              </div>
                            </>
                          )}
                        <div className="flex justify-end gap-4">
                          <span className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">
                            Grand Total
                          </span>
                          <p className="text-lg font-bold text-[#0e212c] font-mono">
                            {Number(t.grandTotal).toLocaleString("en-PH", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}
