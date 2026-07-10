"use client";

import { Download } from "lucide-react";
import { exportCSV } from "@/lib/csv";

interface Props {
  filename: string;
  headers: string[];
  rows: string[][];
  label?: string;
  title?: string;
}

export function ExportButton({ filename, headers, rows, label = "Export CSV", title }: Props) {
  return (
    <button onClick={() => { exportCSV(filename, headers, rows).catch(() => {}); }}
      title={title}
      className="flex items-center gap-2 px-4 py-2.5 border border-[#e2e8f0] text-sm font-medium rounded-lg text-[#64748b] hover:bg-white hover:shadow-sm transition-all duration-200">
      <Download className="h-4 w-4" /> {label}
    </button>
  );
}




