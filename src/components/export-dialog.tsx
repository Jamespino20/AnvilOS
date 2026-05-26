/**
 * @fileoverview Export dialog with column selection and format picker (CSV / XLSX / PDF)
 */

"use client";

import { useState } from "react";
import { Download, X, Loader2, Check, FileText, FileSpreadsheet, File } from "lucide-react";
import { exportCSV, exportXLSX, exportPDF } from "@/lib/csv";

type Format = "csv" | "xlsx" | "pdf";

interface Column {
  key: string;
  label: string;
}

interface Props {
  filename: string;
  allColumns: Column[];
  fetchRows: (selectedColumns: string[]) => Promise<string[][]>;
  label?: string;
  title?: string;
}

const FORMATS: { value: Format; label: string; icon: typeof File }[] = [
  { value: "csv", label: "CSV", icon: FileText },
  { value: "xlsx", label: "XLSX", icon: FileSpreadsheet },
  { value: "pdf", label: "PDF", icon: File },
];

export function ExportDialog({ filename, allColumns, fetchRows, label = "Export", title }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(allColumns.map((c) => c.key));
  const [format, setFormat] = useState<Format>("csv");
  const [loading, setLoading] = useState(false);

  function toggle(key: string) {
    setSelected((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  }

  async function handleExport() {
    setLoading(true);
    try {
      const visible = allColumns.filter((c) => selected.includes(c.key));
      const rows = await fetchRows(selected);
      const base = filename.replace(/\.[^/.]+$/, "");
      const headers = visible.map((c) => c.label);
      if (format === "csv") exportCSV(`${base}.csv`, headers, rows);
      else if (format === "xlsx") await exportXLSX(`${base}.xlsx`, headers, rows);
      else await exportPDF(`${base}.pdf`, headers, rows);
      setOpen(false);
    } catch (e) {
      console.error("Export failed", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        title={title}
        className="h-10 flex items-center gap-2 px-4 border border-[#e2e8f0] text-sm font-medium rounded-lg text-[#64748b] hover:bg-white hover:shadow-sm transition-all duration-200 shrink-0">
        <Download className="h-4 w-4" /> {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl border border-[#e2e8f0] w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#e2e8f0]">
              <h2 className="text-lg font-bold text-[#0e212c]">Export Data</h2>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b] transition-colors"><X className="h-5 w-5" /></button>
            </div>

            <div className="p-6 space-y-5">
              {/* Format selector */}
              <div>
                <p className="text-xs font-bold text-[#64748b] uppercase tracking-wider mb-2">Format</p>
                <div className="flex border border-[#e2e8f0] rounded-lg p-1 bg-[#f8fafc]">
                  {FORMATS.map((f) => {
                    const Icon = f.icon;
                    const active = format === f.value;
                    return (
                      <button key={f.value} onClick={() => setFormat(f.value)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-md transition-all ${
                          active
                            ? "bg-white text-[#fd761a] shadow-sm border border-[#e2e8f0]"
                            : "text-[#64748b] hover:text-[#0e212c] border border-transparent"
                        }`}>
                        <Icon className="h-3.5 w-3.5" />
                        {f.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Column selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-[#64748b] uppercase tracking-wider">{selected.length} of {allColumns.length} columns</p>
                  <button onClick={() => setSelected(selected.length === allColumns.length ? [] : allColumns.map((c) => c.key))}
                    className="text-xs font-medium text-[#fd761a] hover:underline">
                    {selected.length === allColumns.length ? "Deselect All" : "Select All"}
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1 border border-[#e2e8f0] rounded-lg p-2">
                  {allColumns.map((col) => (
                    <button key={col.key} onClick={() => toggle(col.key)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${selected.includes(col.key) ? "bg-[#fff5ed] text-[#fd761a]" : "text-[#64748b] hover:bg-[#f8fafc]"}`}>
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${selected.includes(col.key) ? "border-[#fd761a] bg-[#fd761a]" : "border-[#e2e8f0]"}`}>
                        {selected.includes(col.key) && <Check className="h-3 w-3 text-white" />}
                      </div>
                      {col.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#e2e8f0] flex gap-3">
              <button onClick={() => setOpen(false)} className="flex-1 py-2.5 border border-[#e2e8f0] text-sm font-medium text-[#64748b] rounded-lg hover:bg-[#f8fafc] transition-all">Cancel</button>
              <button onClick={handleExport} disabled={selected.length === 0 || loading}
                className="flex-1 py-2.5 bg-gradient-to-r from-[#fd761a] to-[#e56600] text-white text-sm font-semibold rounded-lg shadow-lg shadow-[#fd761a]/20 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Exporting...</> : <><Download className="h-4 w-4" /> Export {format.toUpperCase()}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}




