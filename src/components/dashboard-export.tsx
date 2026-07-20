"use client";

import { ExportButton } from "@/components/export-button";

interface Data {
  dailySales: number;
  totalTransactions: number;
  totalProducts: number;
  lowStockCount: number;
  revenueTrend: { date: string; total: number }[];
  recentTransactions: { receiptNumber: number; buyerName: string; grandTotal: number; transactionDate: string; transactionType: string; transactionStatus: string }[];
}

export function DashboardExport({ data }: { data: Data }) {
  const now = new Date().toISOString().slice(0, 10);
  return (
    <div className="flex gap-3">
      <ExportButton
        filename={`anvilos-dashboard-${now}.csv`}
        headers={["Metric", "Value"]}
        rows={[
          ["Gross Sales (Today)", `${data.dailySales.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
          ["Total Transactions", String(data.totalTransactions)],
          ["Active Products", String(data.totalProducts)],
          ["Low Stock Alerts", String(data.lowStockCount)],
        ]}
        label="Dashboard CSV"
      />
      <ExportButton
        filename={`anvilos-transactions-${now}.csv`}
        headers={["Receipt #", "Buyer", "Type", "Total", "Status", "Date"]}
        rows={data.recentTransactions.map((t) => [
          String(t.receiptNumber),
          t.buyerName,
          t.transactionType,
          `${Number(t.grandTotal).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          t.transactionStatus,
           new Date(t.transactionDate).toLocaleString("en-PH"),
        ])}
        label="Transactions CSV"
      />
    </div>
  );
}




