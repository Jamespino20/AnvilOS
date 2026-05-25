"use client";

import { AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "danger" | "warning";
  children?: React.ReactNode;
}

export function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = "Confirm", variant = "danger", children }: ConfirmModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl border border-[#e2e8f0] w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${variant === "danger" ? "bg-rose-50 text-rose-500" : "bg-amber-50 text-amber-500"}`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-[#0e212c]">{title}</h3>
            <p className="text-sm text-[#64748b] mt-1 leading-relaxed">{message}</p>
            {children && <div className="mt-3">{children}</div>}
          </div>
          <button onClick={onClose} className="p-1 text-[#94a3b8] hover:text-[#64748b] transition-colors"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 border border-[#e2e8f0] text-sm font-medium text-[#64748b] rounded-lg hover:bg-[#f8fafc] transition-all">Cancel</button>
          <button onClick={onConfirm} className={`flex-1 py-2.5 text-white text-sm font-semibold rounded-lg shadow-lg transition-all ${
            variant === "danger" ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20" : "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20"
          }`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
