"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { getPaginatedAuditLogs, getAuditLogCount } from "@/actions";
import { PageHeader } from "@/components/ui/page-header";
import { CSVImportButton } from "@/components/csv-import";
import { ExportDialog } from "@/components/export-dialog";
import { Shield, ChevronDown, ChevronUp, Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

interface AuditEntry {
  id: number;
  logTime: Date;
  successStatus: boolean;
  panel: string | null;
  action: string | null;
  details: string | null;
  seller: { sellerName: string } | null;
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

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [panel, setPanel] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getPaginatedAuditLogs(page, perPage, { search: search || undefined, panel: panel || undefined, startDate: start || undefined, endDate: end || undefined });
      setLogs(result.logs as unknown as AuditEntry[]);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, panel, start, end]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  function handleSearchChange(val: string) { setSearch(val); setPage(1); }
  function handlePanelChange(val: string) { setPanel(val); setPage(1); }
  function handleStartChange(val: string) { setStart(val); setPage(1); }
  function handleEndChange(val: string) { setEnd(val); setPage(1); }

  async function fetchExportRows(selectedColumns: string[]) {
    const expanded = await getPaginatedAuditLogs(1, 10000, { search: search || undefined, panel: panel || undefined, startDate: start || undefined, endDate: end || undefined });
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader title="Audit Logs" subtitle="Track all system activities, user actions, and changes across modules." />
        <div className="flex items-center gap-2">
          <ExportDialog
            filename={`cwl-hardware-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`}
            allColumns={EXPORT_COLUMNS}
            fetchRows={fetchExportRows}
            label="Export"
            title="Export audit logs as CSV, XLSX, or PDF"
          />
          <CSVImportButton table="audit-logs" onImported={() => {}} title="Import audit logs from CSV" />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
          <input type="text" value={search} onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search actions, details..."
            className="w-full pl-10 pr-4 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a]" />
        </div>
        <select value={panel} onChange={(e) => handlePanelChange(e.target.value)}
          className="min-w-[140px] px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a]">
          <option value="">All Panels</option>
          <option value="POSPanel">POS Panel</option>
          <option value="ProductDialog">Product Dialog</option>
          <option value="SupplierPanel">Supplier Panel</option>
          <option value="EditTransactionDialog">Transaction Edit</option>
          <option value="Register">Register</option>
          <option value="InventoryPanel">Inventory</option>
          <option value="Settings">Settings</option>
          <option value="Buyers">Buyers</option>
        </select>
        <input type="date" value={start} onChange={(e) => handleStartChange(e.target.value)}
          className="px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a]" />
        <input type="date" value={end} onChange={(e) => handleEndChange(e.target.value)}
          className="px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a]" />
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
                <tr><td colSpan={7} className="p-8 text-center text-[#94a3b8]"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></td></tr>
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
                    <td className="p-4 font-medium text-[#0e212c]">{log.seller?.sellerName || "System"}</td>
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
                  {isExpanded && (
                    <tr className="bg-[#f8fafc]">
                      <td colSpan={7} className="p-4 border-t border-[#e2e8f0]">
                        <div className="space-y-3">
                          <p className="text-sm text-[#64748b] leading-relaxed">{log.details || "—"}</p>
                          {deltas.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">Changes</p>
                              {deltas.map((d, i) => (
                                <div key={i} className="flex items-center gap-3 text-sm">
                                  <span className="px-2.5 py-1 rounded bg-rose-50 text-rose-700 line-through font-mono text-xs">{d.before}</span>
                                  <span className="text-[#94a3b8]">→</span>
                                  <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 font-mono text-xs">{d.after}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
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
