import { getTransactions } from "@/actions";
import { Search, Receipt, Download, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default async function TransactionsPage() {
  const transactions = await getTransactions();

  function statusBadge(status: string) {
    const map: Record<string, string> = {
      Completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      Ongoing: "bg-amber-50 text-amber-700 border border-amber-200",
      Cancelled: "bg-rose-50 text-rose-700 border border-rose-200",
    };
    return map[status] || "bg-[#f8fafc] text-[#64748b] border border-[#e2e8f0]";
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#0e212c] tracking-tight">Transaction History</h1>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 border border-[#e2e8f0] text-sm font-medium text-[#64748b] rounded-lg hover:bg-white hover:shadow-sm transition-all duration-200">
            <Download className="h-4 w-4" /> Export
          </button>
          <Link href="/pos" className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#fd761a] to-[#e56600] text-white text-sm font-semibold rounded-lg shadow-lg shadow-[#fd761a]/20 hover:shadow-xl hover:shadow-[#fd761a]/25 transition-all duration-200 active:scale-[0.98]">
            <Receipt className="h-4 w-4" /> New Sale
          </Link>
        </div>
      </div>

      <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                <th className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Receipt #</th>
                <th className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Buyer</th>
                <th className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Type</th>
                <th className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Date</th>
                <th className="text-right p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Total</th>
                <th className="text-center p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {transactions.map((t, i) => (
                <tr key={t.id} className={`${i % 2 === 0 ? "" : "bg-[#fafbfc]"} hover:bg-[#f1f5f9] transition-colors`}>
                  <td className="p-4 font-mono text-sm text-[#0e212c]">#{t.receiptNumber}</td>
                  <td className="p-4 font-medium text-[#0e212c]">{t.buyerName}</td>
                  <td className="p-4 text-[#64748b]">{t.transactionType.replace(/([A-Z])/g, " $1").trim()}</td>
                  <td className="p-4 text-[#64748b]">{new Date(t.transactionDate).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</td>
                  <td className="p-4 text-right font-mono text-[#0e212c] font-semibold">₱{Number(t.grandTotal || 0).toLocaleString()}</td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${statusBadge(t.transactionStatus)}`}>
                      {t.transactionStatus}
                    </span>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-[#94a3b8]">No transactions found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
