"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { X, Settings as SettingsIcon, Save, Loader2, Upload, User, Moon, Sun } from "lucide-react";
import { updateProfile } from "@/actions";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: Props) {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [name, setName] = useState(session?.user?.name || "");
  const [saving, setSaving] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (typeof document !== "undefined") {
      setDarkMode(document.documentElement.classList.contains("dark"));
    }
  }, [open]);

  function toggleDarkMode() {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await updateProfile({ name: name.trim() });
      await update({ name: name.trim() });
      router.refresh();
      onClose();
    } catch (e) {
      console.error("Failed to update profile", e);
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl border border-[#e2e8f0] w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#e2e8f0]">
          <h2 className="text-lg font-bold text-[#0e212c] flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-[#fd761a]" /> Settings
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b] transition-colors"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#fd761a] to-[#e56600] text-white flex items-center justify-center text-2xl font-bold shadow-sm shrink-0">
              {(session?.user?.name || "U").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-[#0e212c]">{session?.user?.name || "User"}</p>
              <p className="text-sm text-[#64748b]">{session?.user?.email}</p>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">Display Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10" />
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg border border-[#e2e8f0]">
            <div className="flex items-center gap-3">
              {darkMode ? <Moon className="h-5 w-5 text-[#64748b]" /> : <Sun className="h-5 w-5 text-[#fd761a]" />}
              <div>
                <p className="text-sm font-medium text-[#0e212c]">Dark Mode</p>
                <p className="text-xs text-[#94a3b8]">Toggle dark theme</p>
              </div>
            </div>
            <button type="button" onClick={toggleDarkMode}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${darkMode ? "bg-[#fd761a]" : "bg-[#e2e8f0]"}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${darkMode ? "translate-x-5" : ""}`} />
            </button>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-[#e2e8f0] text-sm font-medium text-[#64748b] rounded-lg hover:bg-[#f8fafc] transition-all">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-gradient-to-r from-[#fd761a] to-[#e56600] text-white text-sm font-semibold rounded-lg shadow-lg shadow-[#fd761a]/20 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> Save</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
