import { getAuditLogs } from "@/actions";
import { Shield } from "lucide-react";

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string; panel?: string; start?: string; end?: string }>;
}) {
  const sp = await searchParams;
  const logs = await getAuditLogs({
    search: sp?.search,
    panel: sp?.panel,
    startDate: sp?.start,
    endDate: sp?.end,
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-[#0e212c] tracking-tight">Audit Logs</h1>

      <form className="flex flex-wrap gap-3 items-center">
        <input type="text" name="search" defaultValue={sp?.search || ""}
          placeholder="Search actions, details..."
          className="flex-1 min-w-[200px] px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a]" />
        <select name="panel" defaultValue={sp?.panel || ""}
          className="min-w-[140px] px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a]">
          <option value="">All Panels</option>
          <option value="POSPanel">POS Panel</option>
          <option value="ProductDialog">Product Dialog</option>
          <option value="SupplierPanel">Supplier Panel</option>
          <option value="EditTransactionDialog">Transaction Edit</option>
          <option value="Register">Register</option>
        </select>
        <input type="date" name="start" defaultValue={sp?.start || ""}
          className="px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a]" />
        <input type="date" name="end" defaultValue={sp?.end || ""}
          className="px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a]" />
        <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-[#fd761a] to-[#e56600] text-white text-sm font-semibold rounded-lg shadow-lg shadow-[#fd761a]/20 hover:shadow-xl transition-all">Filter</button>
      </form>

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
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {logs.map((log, i) => (
                <tr key={log.id} className={`${i % 2 === 0 ? "" : "bg-[#fafbfc]"} hover:bg-[#f1f5f9] transition-colors`}>
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
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-[#94a3b8]">No audit logs found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
