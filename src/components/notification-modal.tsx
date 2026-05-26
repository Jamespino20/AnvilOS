"use client";

import { useEffect, useState } from "react";
import { X, Bell, CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";

interface Notification {
  id: number;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function NotificationModal({ open, onClose }: Props) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/notifications")
      .then((r) => r.json())
      .then(setNotifications)
      .finally(() => setLoading(false));
  }, [open]);

  async function markRead(id: number) {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    router.refresh();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl border border-[#e2e8f0] w-full max-w-lg mx-4 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#e2e8f0] shrink-0">
          <h2 className="text-lg font-bold text-[#0e212c] flex items-center gap-2">
            <Bell className="h-5 w-5 text-[#fd761a]" /> Notifications
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={markAllRead} className="text-xs text-[#64748b] hover:text-[#fd761a] font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-[#f8fafc] transition-all">
              <CheckCheck className="h-3.5 w-3.5" /> Mark All Read
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b] transition-colors"><X className="h-5 w-5" /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading && <p className="text-sm text-[#94a3b8] text-center py-8">Loading...</p>}
          {!loading && notifications.length === 0 && (
            <p className="text-sm text-[#94a3b8] text-center py-8">No notifications</p>
          )}
          {notifications.map((n) => (
            <div key={n.id} className={`p-4 rounded-lg border transition-colors ${n.isRead ? "bg-white border-[#e2e8f0] text-[#64748b]" : "bg-[#fff5ed] border-[#fd761a]/20 text-[#0e212c]"}`}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm flex-1">{n.message}</p>
                {!n.isRead && (
                  <button onClick={() => markRead(n.id)} className="text-[10px] text-[#fd761a] font-semibold uppercase tracking-wider hover:underline shrink-0">Mark Read</button>
                )}
              </div>
              <p className="text-[11px] text-[#94a3b8] mt-1.5">{new Date(n.createdAt).toLocaleString("en-PH")}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}




