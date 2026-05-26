"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Upload, X, Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { validateImportData, importData } from "@/actions";
import { getImportConfig } from "@/lib/import-configs";

interface Props {
  table: string;
  onImported: () => void;
  title?: string;
}

export function ImportButton({ table, onImported, title }: Props) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<Record<string, string>[]>([]);
  const [errors, setErrors] = useState<{ row: number; column: string; message: string }[]>([]);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number } | null>(null);
  const [config, setConfig] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleOpen() {
    setOpen(true);
    setFile(null);
    setParsed([]);
    setErrors([]);
    setPreview([]);
    setResult(null);
    setConfig(getImportConfig(table));
  }

  function parseFile(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "csv") {
      file.text().then(parseCSV);
    } else if (ext === "xlsx") {
      file.arrayBuffer().then(parseXLSX);
    } else {
      setErrors([{ row: 0, column: "", message: "Unsupported file format. Please use .csv or .xlsx" }]);
    }
  }

  function parseCSV(text: string) {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) { setErrors([{ row: 0, column: "", message: "File must contain a header row and at least one data row" }]); return; }
    const headers = lines[0].split(",").map((h) => h.replace(/^"|"$/g, "").trim());
    const rows = lines.slice(1).map((line) => {
      const vals: string[] = [];
      let current = "", inQuotes = false;
      for (const ch of line) {
        if (ch === '"') inQuotes = !inQuotes;
        else if (ch === "," && !inQuotes) { vals.push(current.trim()); current = ""; }
        else current += ch;
      }
      vals.push(current.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = vals[i] || ""; });
      return row;
    });
    setParsed(rows);
    validateImportData(table, rows).then((r) => {
      setErrors(r.errors);
      setPreview(r.preview);
    });
  }

  function parseXLSX(buffer: ArrayBuffer) {
    try {
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });
      if (json.length < 1) {
        setErrors([{ row: 0, column: "", message: "Sheet must contain a header row and at least one data row" }]);
        return;
      }
      const rows = json.map((row) => {
        const normalized: Record<string, string> = {};
        for (const key of Object.keys(row)) {
          normalized[key.trim()] = String(row[key] ?? "");
        }
        return normalized;
      });
      setParsed(rows);
      validateImportData(table, rows).then((r) => {
        setErrors(r.errors);
        setPreview(r.preview);
      });
    } catch (e: any) {
      setErrors([{ row: 0, column: "", message: "Failed to parse XLSX file: " + (e.message || "Unknown error") }]);
    }
  }

  async function handleImport() {
    setImporting(true);
    try {
      const result = await importData(table, parsed);
      setResult(result);
      onImported();
    } catch (e: any) {
      setErrors([{ row: 0, column: "", message: e.message }]);
    } finally {
      setImporting(false);
    }
  }

  const colCount = config?.columns?.length || 0;

  return (
    <>
      <button onClick={handleOpen}
        title={title}
        className="h-10 flex items-center gap-2 px-4 border border-[#e2e8f0] text-sm font-medium rounded-lg text-[#64748b] hover:bg-white hover:shadow-sm transition-all duration-200">
        <Upload className="h-4 w-4" /> Import
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl border border-[#e2e8f0] w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#e2e8f0]">
              <h2 className="text-lg font-bold text-[#0e212c]">{config?.label || table} â€” Import</h2>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b] transition-colors"><X className="h-5 w-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {!result && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-[#e2e8f0] rounded-xl p-6 text-center hover:border-[#fd761a] transition-colors"
                    onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { setFile(f); parseFile(f); } }}>
                    <input ref={inputRef} type="file" accept=".csv,.xlsx" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); parseFile(f); } }} />
                    {file ? (
                      <div className="space-y-3">
                        <CheckCircle className="h-8 w-8 mx-auto text-emerald-500" />
                        <p className="font-semibold text-[#0e212c]">{file.name}</p>
                        <p className="text-xs text-[#94a3b8]">{(file.size / 1024).toFixed(1)} KB</p>
                        <button onClick={() => inputRef.current?.click()} className="text-xs text-[#fd761a] font-medium hover:underline">Choose a different file</button>
                      </div>
                    ) : (
                      <div className="space-y-3 cursor-pointer" onClick={() => inputRef.current?.click()}>
                        <Upload className="h-8 w-8 mx-auto text-[#94a3b8]" />
                        <p className="font-medium text-[#0e212c]">Drop a CSV or XLSX file here or click to browse</p>
                        <p className="text-xs text-[#94a3b8] truncate max-w-full" title={config?.columns?.map((c: any) => c.label).join(", ") || ""}>Expected columns: {config?.columns?.map((c: any) => c.label).join(", ")}</p>
                      </div>
                    )}
                  </div>

                  {config && (
                    <div className="bg-[#f8fafc] rounded-lg p-4">
                      <p className="text-xs font-bold text-[#64748b] uppercase tracking-wider mb-2">Expected Columns & Types</p>
                      <div className="grid grid-cols-2 gap-2">
                        {config.columns.map((col: any) => (
                          <div key={col.key} className="flex items-center gap-2 text-xs">
                            <span className={`w-1.5 h-1.5 rounded-full ${col.required ? "bg-rose-500" : "bg-[#94a3b8]"}`} />
                            <span className="font-medium text-[#0e212c]">{col.label}</span>
                            <span className="text-[#94a3b8] truncate" title={`(${col.type}${col.enum ? `: ${col.enum.join("|")}` : ""})${col.required ? " *" : ""}`}>({col.type}{col.enum ? `: ${col.enum.join("|")}` : ""}){col.required ? " *" : ""}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {errors.length > 0 && (
                    <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 space-y-1">
                      <p className="text-xs font-bold text-rose-700 flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> {errors.length} Validation Error{errors.length !== 1 ? "s" : ""}</p>
                      {errors.slice(0, 10).map((e, i) => (
                        <p key={i} className="text-xs text-rose-600">Row {e.row}: {e.column ? `"${e.column}" â€” ` : ""}{e.message}</p>
                      ))}
                      {errors.length > 10 && <p className="text-xs text-rose-500">...and {errors.length - 10} more</p>}
                    </div>
                  )}

                  {preview.length > 0 && errors.length === 0 && (
                    <div>
                      <p className="text-sm font-semibold text-[#0e212c] mb-2">{preview.length} row{preview.length !== 1 ? "s" : ""} ready to import</p>
                      <div className="overflow-x-auto border border-[#e2e8f0] rounded-lg">
                        <table className="w-full text-xs">
                          <thead><tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">{config.columns.map((c: any) => <th key={c.key} className="text-left p-2 font-semibold text-[#64748b]">{c.label}</th>)}</tr></thead>
                          <tbody className="divide-y divide-[#e2e8f0]">{preview.slice(0, 5).map((row, i) => (
                            <tr key={i}>{config.columns.map((c: any) => <td key={c.key} className="p-2 text-[#0e212c] max-w-[150px] truncate">{row[c.key] || "â€”"}</td>)}</tr>
                          ))}</tbody>
                        </table>
                        {preview.length > 5 && <p className="text-xs text-[#94a3b8] text-center py-2 border-t border-[#e2e8f0]">...and {preview.length - 5} more rows</p>}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {result && (
                <div className="text-center py-8 space-y-3">
                  <CheckCircle className="h-12 w-12 mx-auto text-emerald-500" />
                  <p className="text-lg font-bold text-[#0e212c]">Import Complete</p>
                  <p className="text-sm text-[#64748b]">{result.imported} {table} imported successfully</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-[#e2e8f0] flex items-center justify-between">
              {result ? (
                <button onClick={() => setOpen(false)} className="px-6 py-2.5 bg-[#0e212c] text-white text-sm font-semibold rounded-lg hover:bg-[#1a3a4a] transition-all">Done</button>
              ) : (
                <div className="flex gap-3 w-full">
                  <button onClick={() => setOpen(false)} className="flex-1 py-2.5 border border-[#e2e8f0] text-sm font-medium text-[#64748b] rounded-lg hover:bg-[#f8fafc] transition-all">Cancel</button>
                  <button onClick={handleImport} disabled={parsed.length === 0 || errors.length > 0 || importing}
                    className="flex-1 py-2.5 bg-gradient-to-r from-[#fd761a] to-[#e56600] text-white text-sm font-semibold rounded-lg shadow-lg shadow-[#fd761a]/20 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {importing ? <><Loader2 className="h-4 w-4 animate-spin" /> Importing...</> : <>Import {parsed.length} Row{parsed.length !== 1 ? "s" : ""}</>}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}




