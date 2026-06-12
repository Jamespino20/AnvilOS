"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { getPaginatedAuditLogs, getAuditLogUsers } from "@/actions";
import { PageHeader } from "@/components/ui/page-header";
import { ImportButton } from "@/components/import-button";
import { ExportDialog } from "@/components/export-dialog";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Shield, ChevronDown, ChevronUp, Search, Loader2, ChevronLeft, ChevronRight, X } from "lucide-react";
import { getDateScopeStart, getDateScopeEnd, DATE_SCOPES } from "@/lib/format";

interface AuditEntry {
  id: number;
  logTime: Date;
  successStatus: boolean;
  panel: string | null;
  action: string | null;
  details: string | null;
  seller: { sellerName: string; imageUrl?: string | null } | null;
}

function parseDetails(details: string | null): { text: string; deltas: { before: string; after: string }[] } {
  if (!details) return { text: "", deltas: [] };
  const deltas: { before: string; after: string }[] = [];
  const arrowRegex = /([^→]+)\s*→\s*([^,;\n]+)/g;
  let match;
  let text = details;
  while ((match = arrowRegex.exec(details)) !== null) {
    deltas.push({ before: match[1].trim(), after: match[2].trim() });
    text = text.replace(match[0], `${match[1].trim()} → ${match[2].trim()}`);
  }
  return { text, deltas };
}

const PER_PAGE_OPTIONS = [10, 25, 50, 100, 200];

const EXPORT_COLUMNS = [
  { key: "logTime", label: "Time" },
  { key: "seller", label: "User" },
  { key: "panel", label: "Panel" },
  { key: "action", label: "Action" },
  { key: "details", label: "Details" },
  { key: "successStatus", label: "Status" },
];

interface AuditUser {
  id: number;
  sellerName: string;
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [panel, setPanel] = useState("");
  const [dateScope, setDateScope] = useState("today");
  const [auditUsers, setAuditUsers] = useState<AuditUser[]>([]);
  const [sellerFilter, setSellerFilter] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const dateStart = dateScope !== "all" ? getDateScopeStart(dateScope) : undefined;
  const dateEnd = dateScope !== "all" ? getDateScopeEnd(dateScope) : undefined;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getPaginatedAuditLogs(page, perPage, {
        search: search || undefined,
        panel: panel || undefined,
        startDate: dateStart,
        endDate: dateEnd,
        sellerId: sellerFilter ? Number(sellerFilter) : undefined,
      });
      setLogs(result.logs as unknown as AuditEntry[]);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, panel, dateStart, dateEnd, sellerFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  useEffect(() => {
    getAuditLogUsers().then(setAuditUsers).catch(() => {});
  }, []);

  function handleSearchChange(val: string) { setSearch(val); setPage(1); }
  function handlePanelChange(val: string) { setPanel(val); setPage(1); }
  function handleDateScopeChange(val: string) { setDateScope(val); setPage(1); }
  function handleSellerChange(val: string) { setSellerFilter(val); setPage(1); }

  async function fetchExportRows(selectedColumns: string[]) {
    const expanded = await getPaginatedAuditLogs(1, 10000, {
      search: search || undefined,
      panel: panel || undefined,
      startDate: dateStart,
      endDate: dateEnd,
      sellerId: sellerFilter ? Number(sellerFilter) : undefined,
    });
    return expanded.logs.map((log: any) =>
      selectedColumns.map((key) => {
        if (key === "logTime") return new Date(log.logTime).toLocaleString("en-PH");
        if (key === "seller") return log.seller?.sellerName || "System";
        if (key === "successStatus") return log.successStatus ? "Success" : "Failed";
        return String(log[key] ?? "");
      })
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Audit Logs" subtitle="Track all system activities, user actions, and changes across modules." />

      <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative w-full lg:flex-1 min-w-0 sm:min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
          <input type="text" value={search} onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by action, panel, user..."
            className="w-full h-10 pl-10 pr-4 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10" />
        </div>
        <div className="flex gap-2 w-full lg:w-auto flex-wrap">
          <div className="flex items-center gap-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-1">
            {DATE_SCOPES.map((s) => (
              <button key={s.value} onClick={() => handleDateScopeChange(s.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${dateScope === s.value ? "bg-[#fd761a] text-white shadow-sm" : "text-[#64748b] hover:text-[#0e212c]"}`}>
                {s.label}
              </button>
            ))}
          </div>
          <select value={panel} onChange={(e) => handlePanelChange(e.target.value)}
            className="h-10 px-3 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a] min-w-[120px]">
            <option value="">Panel</option>
            <option value="POSPanel">POS Panel</option>
            <option value="ProductDialog">Product Dialog</option>
            <option value="SupplierPanel">Supplier Panel</option>
            <option value="EditTransactionDialog">Transaction Edit</option>
            <option value="Register">Register</option>
            <option value="InventoryPanel">Inventory</option>
            <option value="Settings">Settings</option>
            <option value="Buyers">Buyers</option>
          </select>
          <select value={sellerFilter} onChange={(e) => handleSellerChange(e.target.value)}
            className="h-10 px-3 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a] min-w-[140px]">
            <option value="">User</option>
            {auditUsers.map((u) => (
              <option key={u.id} value={u.id}>{u.sellerName}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 w-full lg:w-auto">
          <ExportDialog
            filename={`cwl-hardware-audit-logs${dateScope !== "all" ? `-${getDateScopeStart(dateScope) || ""}` : ""}-${new Date().toISOString().slice(0, 10)}.csv`}
            allColumns={EXPORT_COLUMNS}
            fetchRows={fetchExportRows}
            label="Export"
            title="Export audit logs as CSV, XLSX, or PDF"
            filterLabel={dateScope !== "all" ? DATE_SCOPES.find((s) => s.value === dateScope)?.label : undefined}
          />
          <ImportButton table="audit-logs" onImported={() => {}} title="Import audit logs from CSV or XLSX" />
        </div>
      </div>

      <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                <th className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Time</th>
                <th className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">User</th>
                <th className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Panel</th>
                <th className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Action</th>
                <th className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Details</th>
                <th className="text-center p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Status</th>
                <th className="text-center p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {loading ? (
                <tr><td colSpan={7}><TableSkeleton rows={6} cols={7} /></td></tr>
              ) : logs.map((log) => {
                const { deltas } = parseDetails(log.details);
                const isExpanded = expandedId === log.id;
                return (
                  <Fragment key={log.id}>
                  <tr className={`${isExpanded ? "bg-[#f8fafc]" : ""} hover:bg-[#f1f5f9] transition-colors`}>
                    <td className="p-4 text-[#64748b] whitespace-nowrap font-mono text-xs">
                      {new Date(log.logTime).toLocaleString("en-PH", {
                        month: "short", day: "numeric",
                        hour: "2-digit", minute: "2-digit", second: "2-digit",
                      })}
                    </td>
                    <td className="p-4 font-medium text-[#0e212c]">
                      <div className="flex items-center gap-2">
                        {log.seller?.imageUrl ? (
                          <img
                            src={log.seller.imageUrl}
                            alt={log.seller.sellerName}
                            className="w-6 h-6 rounded-full object-cover shrink-0"
                          />
                        ) : null}
                        {log.seller?.sellerName || "System"}
                      </div>
                    </td>
                    <td className="p-4 text-[#64748b]">{log.panel || "—"}</td>
                    <td className="p-4 text-[#0e212c]">{log.action || "—"}</td>
                    <td className="p-4 text-[#64748b] max-w-xs truncate">{log.details || "—"}</td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        log.successStatus ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}>
                        {log.successStatus ? "Success" : "Failed"}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {(deltas.length > 0 || log.details) && (
                        <button onClick={() => setExpandedId(isExpanded ? null : log.id)}
                          title="View details"
                          className="p-1 text-[#94a3b8] hover:text-[#0e212c] transition-colors">
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      )}
                    </td>
                  </tr>

                  </Fragment>
                );
              })}
              {!loading && logs.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-[#94a3b8]">No audit logs found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail modal */}
      {expandedId !== null && (() => {
        const log = logs.find((l) => l.id === expandedId);
        if (!log) return null;
        const { deltas } = parseDetails(log.details);

        const fields: { label: string; value: string }[] = [];
        const d = log.details || "";

        const createdMatch = d.match(/Product #(\d+) created(?:\s*\(([^)]+)\))?/);
        if (createdMatch) {
          fields.push({ label: "Product ID", value: `#${createdMatch[1]}` });
          if (createdMatch[2]) fields.push({ label: "Product Name", value: createdMatch[2] });
        }

        const renamedMatch = d.match(/(?:Category|Brand|Supplier) renamed to (.+?)(?:\.|$)/i);
        if (renamedMatch) fields.push({ label: "New Name", value: renamedMatch[1] });

        const receiptMatch = d.match(/Receipt[:\s#]+([A-Z0-9-]+)/i);
        if (receiptMatch) fields.push({ label: "Receipt #", value: receiptMatch[1] });

        const buyerMatch = d.match(/buyer[:\s]+([^.;\n]+)/i);
        if (buyerMatch) fields.push({ label: "Buyer", value: buyerMatch[1].trim() });

        const totalMatch = d.match(/total[:\s]+([₱\d,.\s]+)/i);
        if (totalMatch) fields.push({ label: "Total", value: totalMatch[1].trim() });

        const stockMatch = d.match(/stock[:\s]+(\d+)\s*→\s*(\d+)/i);
        if (stockMatch) {
          fields.push({ label: "Old Quantity", value: stockMatch[1] });
          fields.push({ label: "New Quantity", value: stockMatch[2] });
        }

        const amountMatch = d.match(/amount[:\s]+([₱\d,.\s]+)/i);
        if (amountMatch && !totalMatch) fields.push({ label: "Amount", value: amountMatch[1].trim() });

        const userMatch = d.match(/user[:\s]+([^.;\n]+)/i);
        if (userMatch) fields.push({ label: "Target User", value: userMatch[1].trim() });

        const roleMatch = d.match(/role[:\s]+(\w+)/i);
        if (roleMatch) fields.push({ label: "Role", value: roleMatch[1] });

        const dateMatch = d.match(/date[:\s]+([^.;\n]+)/i);
        if (dateMatch) fields.push({ label: "Date", value: dateMatch[1].trim() });

        const qtyMatch = d.match(/qty[:\s]+(\d+)/i);
        if (qtyMatch && !stockMatch) fields.push({ label: "Quantity", value: qtyMatch[1] });

        const remaining = d
          .replace(/Product #\d+ created(?:\s*\([^)]+\))?/gi, "")
          .replace(/(?:Category|Brand|Supplier) renamed to [.]+\.?/gi, "")
          .replace(/Receipt[:\s#]+[A-Z0-9-]+/gi, "")
          .replace(/buyer[:\s]+[^.;\n]+/gi, "")
          .replace(/total[:\s]+[₱\d,.\s]+/gi, "")
          .replace(/stock[:\s]+\d+\s*→\s*\d+/gi, "")
          .replace(/amount[:\s]+[₱\d,.\s]+/gi, "")
          .replace(/user[:\s]+[^.;\n]+/gi, "")
          .replace(/role[:\s]+\w+/gi, "")
          .replace(/date[:\s]+[^.;\n]+/gi, "")
          .replace(/qty[:\s]+\d+/gi, "")
          .replace(/[,;.\s]+/g, " ")
          .trim();

        const panelLabel: Record<string, string> = {
          POSPanel: "Point of Sale",
          ProductDialog: "Products",
          SupplierPanel: "Suppliers",
          EditTransactionDialog: "Transactions",
          Register: "Registration",
          InventoryPanel: "Inventory",
          Settings: "Settings",
          Buyers: "Buyers",
        };

        return (
          <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-[#e2e8f0] w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-[#fd761a]/10">
                    <Shield className="h-5 w-5 text-[#fd761a]" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-[#0e212c] truncate">
                      {panelLabel[log.panel || ""] || log.panel || "System"} — {log.action || "Action"}
                    </h2>
                    <p className="text-xs text-[#94a3b8] mt-0.5 font-mono">
                      {new Date(log.logTime).toLocaleString("en-PH", {
                        year: "numeric", month: "short", day: "numeric",
                        hour: "2-digit", minute: "2-digit", second: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <button onClick={() => setExpandedId(null)}
                  className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b] transition-colors shrink-0 ml-4">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-5 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {log.seller?.imageUrl ? (
                      <img
                        src={log.seller.imageUrl}
                        alt={log.seller.sellerName}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[#0e212c] flex items-center justify-center text-white text-sm font-bold">
                        {(log.seller?.sellerName || "S").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] text-[#94a3b8] uppercase tracking-wider">Performed by</p>
                      <p className="text-sm font-semibold text-[#0e212c]">{log.seller?.sellerName || "System"}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    log.successStatus ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}>
                    {log.successStatus ? "Success" : "Failed"}
                  </span>
                </div>

                {(fields.length > 0 || remaining) && (
                  <div className="border border-[#e2e8f0] rounded-lg p-4 space-y-3">
                    <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">Details</p>
                    {fields.length > 0 && (
                      <div className="grid grid-cols-2 gap-3">
                        {fields.map((f) => (
                          <div key={f.label}>
                            <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">{f.label}</p>
                            <p className="text-sm text-[#0e212c] font-medium mt-0.5">{f.value}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {remaining && (
                      <div className={fields.length > 0 ? "pt-2 border-t border-[#e2e8f0]" : ""}>
                        <p className="text-sm text-[#64748b] leading-relaxed">{remaining}</p>
                      </div>
                    )}
                  </div>
                )}

                {deltas.length > 0 && (
                  <div className="border border-[#e2e8f0] rounded-lg p-4 space-y-3">
                    <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">Changes</p>
                    <div className="space-y-2">
                      {deltas.map((d, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="px-2.5 py-1 rounded bg-rose-50 text-rose-700 line-through font-mono text-xs">{d.before}</span>
                          <span className="text-[#94a3b8] text-xs">→</span>
                          <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 font-mono text-xs">{d.after}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!fields.length && !deltas.length && !remaining && (
                  <div className="text-center py-6">
                    <p className="text-sm text-[#94a3b8]">No additional details available for this log entry.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="text-[#64748b]">{total} total logs</span>
            <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
              className="ml-2 px-2 py-1 border border-[#e2e8f0] rounded-lg text-xs focus:outline-none focus:border-[#fd761a] bg-white">
              {PER_PAGE_OPTIONS.map((n) => <option key={n} value={n}>{n} / page</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
              title="Previous page"
              className="p-1.5 border border-[#e2e8f0] rounded-lg text-[#64748b] hover:bg-white disabled:opacity-50 transition-all">
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let p: number;
              if (totalPages <= 7) p = i + 1;
              else if (page <= 4) p = i + 1;
              else if (page >= totalPages - 3) p = totalPages - 6 + i;
              else p = page - 3 + i;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${p === page ? "bg-[#fd761a] text-white" : "text-[#64748b] hover:bg-[#f1f5f9]"}`}>
                  {p}
                </button>
              );
            })}
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
              title="Next page"
              className="p-1.5 border border-[#e2e8f0] rounded-lg text-[#64748b] hover:bg-white disabled:opacity-50 transition-all">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}




