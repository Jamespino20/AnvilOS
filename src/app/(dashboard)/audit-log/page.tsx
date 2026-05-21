import { getAuditLogs } from "@/actions";
import { Shield, Download } from "lucide-react";

export default async function AuditLogPage() {
  const logs = await getAuditLogs();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#0e212c] tracking-tight">Audit Logs</h1>
        <button className="flex items-center gap-2 px-5 py-2.5 border border-[#e2e8f0] text-sm font-medium text-[#64748b] rounded-lg hover:bg-white hover:shadow-sm transition-all duration-200">
          <Download className="h-4 w-4" /> Export
        </button>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {logs.map((log, i) => (
                <tr key={log.id} className={`${i % 2 === 0 ? "" : "bg-[#fafbfc]"} hover:bg-[#f1f5f9] transition-colors`}>
                  <td className="p-4 text-[#64748b] whitespace-nowrap font-mono text-xs">
                    {new Date(log.logTime).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
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
