import { getTransactions } from "@/actions";
import { Search, Receipt, Download } from "lucide-react";
import Link from "next/link";

export default async function TransactionsPage() {
  const transactions = await getTransactions();

  function statusBadge(status: string) {
    const map: Record<string, string> = {
      Completed: "bg-[#dcfce7] text-[#166534]",
      Ongoing: "bg-[#fef08a] text-[#854d0e]",
      Cancelled: "bg-[#fee2e2] text-[#991b1b]",
    };
    return map[status] || "bg-surface-container-low text-on-surface-variant";
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-on-surface">Transaction History</h1>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-outline text-sm rounded hover:bg-surface-container-low transition-colors">
            <Download className="h-4 w-4" /> Export
          </button>
          <Link href="/pos" className="flex items-center gap-2 px-4 py-2 bg-secondary text-on-secondary text-sm rounded hover:bg-secondary/90 transition-colors">
            <Receipt className="h-4 w-4" /> New Sale
          </Link>
        </div>
      </div>

      <div className="bg-white border border-outline rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-container-low border-b border-outline">
              <tr>
                <th className="text-left p-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Receipt #</th>
                <th className="text-left p-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Buyer</th>
                <th className="text-left p-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Type</th>
                <th className="text-left p-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Date</th>
                <th className="text-right p-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Total</th>
                <th className="text-center p-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline/50">
              {transactions.map((t, i) => (
                <tr key={t.id} className={`${i % 2 === 0 ? "" : "bg-[#F8FAFC]"} hover:bg-surface-container-low transition-colors`}>
                  <td className="p-3 font-mono text-sm">{t.receiptNumber}</td>
                  <td className="p-3 font-medium">{t.buyerName}</td>
                  <td className="p-3 text-on-surface-variant">{t.transactionType.replace(/([A-Z])/g, " $1").trim()}</td>
                  <td className="p-3 text-on-surface-variant">{new Date(t.transactionDate).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</td>
                  <td className="p-3 text-right font-mono">₱{Number(t.grandTotal || 0).toLocaleString()}</td>
                  <td className="p-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${statusBadge(t.transactionStatus)}`}>
                      {t.transactionStatus}
                    </span>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-on-surface-variant">No transactions found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
