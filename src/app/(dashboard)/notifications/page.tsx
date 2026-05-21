"use client";

import { useState, useEffect } from "react";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "@/actions";
import { Bell, CheckCheck, Package, AlertTriangle, Info, Loader2 } from "lucide-react";
import type { Notification } from "@prisma/client";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    getNotifications().then((data) => {
      setNotifications(data);
      setLoading(false);
    });
  }, []);

  function icon(type: string) {
    if (type.startsWith("Stock")) return <Package className="h-4 w-4" />;
    if (type.startsWith("Alert")) return <AlertTriangle className="h-4 w-4 text-rose-500" />;
    return <Info className="h-4 w-4 text-[#fd761a]" />;
  }

  function iconBg(type: string) {
    if (type.startsWith("Stock")) return "bg-teal-50 text-teal-600";
    if (type.startsWith("Alert")) return "bg-rose-50 text-rose-600";
    return "bg-orange-50 text-[#fd761a]";
  }

  async function handleMarkAllRead() {
    setMarking(true);
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error("Failed to mark all read", e);
    } finally {
      setMarking(false);
    }
  }

  async function handleMarkRead(id: number) {
    try {
      await markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (e) {
      console.error("Failed to mark read", e);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-[#64748b]">Loading notifications...</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#0e212c] tracking-tight">Notifications</h1>
        <button onClick={handleMarkAllRead} disabled={marking || notifications.every((n) => n.isRead)}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#e2e8f0] text-sm font-medium text-[#64748b] rounded-lg hover:bg-[#f8fafc] hover:shadow-sm transition-all duration-200 disabled:opacity-50">
          {marking ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />} Mark All Read
        </button>
      </div>

      <div className="space-y-2">
        {notifications.map((n) => (
          <div key={n.id}
            onClick={() => !n.isRead && handleMarkRead(n.id)}
            className={`bg-white border border-[#e2e8f0] rounded-xl p-4 flex items-start gap-4 transition-all duration-200 cursor-pointer hover:shadow-md ${
              !n.isRead ? "border-l-4 border-l-[#fd761a] shadow-sm" : "opacity-70"
            }`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconBg(n.systemNotification)}`}>
              {icon(n.systemNotification)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#0e212c] font-medium">{n.message}</p>
              <p className="text-xs text-[#94a3b8] mt-1">{new Date(n.createdAt).toLocaleString("en-PH")}</p>
            </div>
            {!n.isRead && <span className="w-2 h-2 rounded-full bg-[#fd761a] shrink-0 mt-2 animate-pulse" />}
          </div>
        ))}
        {notifications.length === 0 && (
          <div className="text-center py-16 text-[#94a3b8]">
            <Bell className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p className="font-medium">All clear</p>
            <p className="text-xs mt-1">No notifications yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
