import { getAuditLogs } from "@/actions";
import { Shield, Download } from "lucide-react";

export default async function AuditLogPage() {
  const logs = await getAuditLogs();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-on-surface">Audit Logs</h1>
        <button className="flex items-center gap-2 px-4 py-2 border border-outline text-sm rounded hover:bg-surface-container-low transition-colors">
          <Download className="h-4 w-4" /> Export
        </button>
      </div>

      <div className="bg-white border border-outline rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-container-low border-b border-outline">
              <tr>
                <th className="text-left p-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Time</th>
                <th className="text-left p-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">User</th>
                <th className="text-left p-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Panel</th>
                <th className="text-left p-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Action</th>
                <th className="text-left p-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Details</th>
                <th className="text-center p-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline/50">
              {logs.map((log, i) => (
                <tr key={log.id} className={`${i % 2 === 0 ? "" : "bg-[#F8FAFC]"} hover:bg-surface-container-low transition-colors`}>
                  <td className="p-3 text-on-surface-variant whitespace-nowrap">{new Date(log.logTime).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                  <td className="p-3 font-medium">{log.seller?.sellerName || "System"}</td>
                  <td className="p-3 text-on-surface-variant">{log.panel || "—"}</td>
                  <td className="p-3">{log.action || "—"}</td>
                  <td className="p-3 text-on-surface-variant max-w-xs truncate">{log.details || "—"}</td>
                  <td className="p-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${log.successStatus ? "bg-[#dcfce7] text-[#166534]" : "bg-[#fee2e2] text-[#991b1b]"}`}>
                      {log.successStatus ? "Success" : "Failed"}
                    </span>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-on-surface-variant">No audit logs found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
