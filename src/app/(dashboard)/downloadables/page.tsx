/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: July 10, 2026
*/

"use client";

import { useState, useEffect } from "react";
import { Download, FileText, FileSpreadsheet, File, Loader2, Plus, X, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { toast } from "sonner";
import {
  getCustomDownloadables,
  createCustomDownloadable,
  deleteCustomDownloadable,
  getCustomDownloadableData,
} from "@/actions";

const BUILTIN = [
  {
    name: "Price List Template",
    description: "CSV template with columns for product name, category, brand, selling price, unit price, and quantity.",
    filename: "cwl-price-list-template.csv",
    generate: () => {
      const headers = ["Product Name", "Category", "Brand", "Selling Price", "Unit Price", "Quantity"];
      const rows = [
        headers.join(","),
        '"Example Product","Power Tools","DeWalt","1500.00","1200.00","10"',
        '"","","","","",""',
      ];
      return new Blob(["\ufeff" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    },
    icon: FileText,
  },
  {
    name: "Inventory Import Template",
    description: "CSV template matching the import columns for bulk inventory updates.",
    filename: "cwl-inventory-import-template.csv",
    generate: () => {
      const headers = ["Product Name", "Category", "Supplier", "Brand", "Selling Price", "Unit Price", "Quantity", "Min Threshold"];
      const rows = [
        headers.join(","),
        '"","","","","","","",""',
      ];
      return new Blob(["\ufeff" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    },
    icon: FileSpreadsheet,
  },
  {
    name: "Buyer List Template",
    description: "CSV template for importing buyers with name, contact, address, and email fields.",
    filename: "cwl-buyers-template.csv",
    generate: () => {
      const headers = ["Buyer Name", "Contact", "Address", "Email"];
      const rows = [
        headers.join(","),
        '"","","",""',
      ];
      return new Blob(["\ufeff" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    },
    icon: FileText,
  },
  {
    name: "CWL Hardware Logo",
    description: "Official company logo for use in reports, invoices, and documents.",
    filename: "CWLHardware_Logo.png",
    generate: async () => {
      const resp = await fetch("/images/CWLHardware_Logo.png");
      return await resp.blob();
    },
    icon: File,
  },
];

export default function DownloadablesPage() {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [customFiles, setCustomFiles] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState("");
  const [addDesc, setAddDesc] = useState("");
  const [addFile, setAddFile] = useState<File | null>(null);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    getCustomDownloadables().then(setCustomFiles).catch(() => {});
  }, []);

  async function handleDownloadBuiltin(item: typeof BUILTIN[number]) {
    setLoading((prev) => ({ ...prev, [item.name]: true }));
    try {
      const blob = await item.generate();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = item.filename;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success(`${item.name} downloaded`);
    } catch {
      toast.error("Download failed");
    } finally {
      setLoading((prev) => ({ ...prev, [item.name]: false }));
    }
  }

  async function handleDownloadCustom(item: any) {
    setLoading((prev) => ({ ...prev, [`custom-${item.id}`]: true }));
    try {
      const data = await getCustomDownloadableData(item.id);
      const byteStr = atob(data.fileData.split(",").pop() || data.fileData);
      const ab = new ArrayBuffer(byteStr.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteStr.length; i++) ia[i] = byteStr.charCodeAt(i);
      const blob = new Blob([ab], { type: data.fileType });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = data.fileName;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success(`${item.name} downloaded`);
    } catch {
      toast.error("Download failed");
    } finally {
      setLoading((prev) => ({ ...prev, [`custom-${item.id}`]: false }));
    }
  }

  async function handleAddFile() {
    if (!addName.trim() || !addFile) return;
    setAdding(true);
    try {
      const reader = new FileReader();
      const b64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(addFile);
      });
      const created = await createCustomDownloadable({
        name: addName.trim(),
        description: addDesc.trim() || undefined,
        fileName: addFile.name,
        fileData: b64,
        fileType: addFile.type || "application/octet-stream",
        fileSize: addFile.size,
      });
      const files = await getCustomDownloadables();
      setCustomFiles(files);
      setShowAdd(false);
      setAddName("");
      setAddDesc("");
      setAddFile(null);
      toast.success("File added to downloadables");
    } catch (e: any) {
      toast.error(e.message || "Failed to add file");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      await deleteCustomDownloadable(id);
      setCustomFiles((prev) => prev.filter((f) => f.id !== id));
      toast.success("File removed");
    } catch (e: any) {
      toast.error(e.message || "Failed to delete file");
    } finally {
      setDeletingId(null);
    }
  }

  function fileIcon(mime: string) {
    if (mime.includes("spreadsheet") || mime.includes("csv") || mime.includes("xls")) return FileSpreadsheet;
    if (mime.includes("text") || mime.includes("pdf")) return FileText;
    return File;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Downloadables"
          subtitle="Download templates, forms, and constant files for offline use."
        />
        <button
          onClick={() => { setShowAdd(true); setAddName(""); setAddDesc(""); setAddFile(null); }}
          className="flex items-center justify-center gap-2 px-5 h-10 bg-gradient-to-r from-[#fd761a] to-[#e56600] text-white text-sm font-semibold rounded-lg shadow-lg shadow-[#fd761a]/20 hover:shadow-xl transition-all active:scale-[0.98] shrink-0"
        >
          <Plus className="h-4 w-4" /> Add File
        </button>
      </div>

      {(customFiles.length > 0 || BUILTIN.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BUILTIN.map((item) => {
            const Icon = item.icon;
            const isBusy = loading[item.name];
            return (
              <div key={item.name} className="bg-white border border-[#e2e8f0] rounded-xl p-5 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#f1f5f9] flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-[#fd761a]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-[#0e212c]">{item.name}</h3>
                    <p className="text-xs text-[#64748b] mt-1 leading-relaxed">{item.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDownloadBuiltin(item)}
                  disabled={isBusy}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 border border-[#e2e8f0] text-sm font-medium text-[#64748b] rounded-lg hover:bg-[#f8fafc] hover:text-[#fd761a] transition-all disabled:opacity-50"
                >
                  {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Download
                </button>
              </div>
            );
          })}

          {customFiles.map((item) => {
            const Icon = fileIcon(item.fileType);
            const isBusy = loading[`custom-${item.id}`];
            const isDeleting = deletingId === item.id;
            return (
              <div key={item.id} className="bg-white border border-[#e2e8f0] rounded-xl p-5 hover:shadow-lg transition-shadow relative group">
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={isDeleting}
                  className="absolute top-3 right-3 p-1.5 rounded-md text-[#94a3b8] hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-30"
                  title="Remove file"
                >
                  {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </button>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#fff5ed] flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-[#fd761a]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-[#0e212c]">{item.name}</h3>
                    {item.description && (
                      <p className="text-xs text-[#64748b] mt-1 leading-relaxed">{item.description}</p>
                    )}
                    <p className="text-[10px] text-[#94a3b8] mt-1.5 font-mono">
                      {item.fileName} &middot; {(item.fileSize / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDownloadCustom(item)}
                  disabled={isBusy}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 border border-[#e2e8f0] text-sm font-medium text-[#64748b] rounded-lg hover:bg-[#f8fafc] hover:text-[#fd761a] transition-all disabled:opacity-50"
                >
                  {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Download
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add File Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-xl shadow-2xl border border-[#e2e8f0] w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#e2e8f0]">
              <h2 className="text-lg font-bold text-[#0e212c]">Add Downloadable File</h2>
              <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b] transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">Name *</label>
                <input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="e.g. Price List 2026" autoFocus
                  className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">Description</label>
                <input value={addDesc} onChange={(e) => setAddDesc(e.target.value)} placeholder="Optional description"
                  className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">File *</label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 cursor-pointer">
                    <input type="file" onChange={(e) => setAddFile(e.target.files?.[0] || null)} className="hidden" />
                    <div className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#64748b] bg-white hover:bg-[#f8fafc] transition-colors text-center truncate">
                      {addFile ? addFile.name : "Choose File"}
                    </div>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 border border-[#e2e8f0] text-sm font-medium text-[#64748b] rounded-lg hover:bg-[#f8fafc] transition-all">Cancel</button>
                <button onClick={handleAddFile} disabled={!addName.trim() || !addFile || adding}
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#fd761a] to-[#e56600] text-white text-sm font-semibold rounded-lg shadow-lg shadow-[#fd761a]/20 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {adding ? <><Loader2 className="h-4 w-4 animate-spin" /> Adding...</> : "Add File"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
