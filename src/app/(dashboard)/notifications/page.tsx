/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: June 13, 2026
*/

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/actions";
import { Bell, CheckCheck, Loader2, CheckCircle, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";

interface NotificationItem {
  id: number;
  systemNotification: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export default function NotificationsPage() {
  const { data: session } = useSession();
  const userId = Number(session?.user?.id ?? 0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    if (!userId) return;
    setLoading(true);
    getNotifications(userId).then((data) => {
      setNotifications(data as NotificationItem[]);
      setLoading(false);
    });
  }

  useEffect(() => {
    if (userId) load();
  }, [userId]);

  async function handleMarkRead(id: number) {
    await markNotificationRead(userId, id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
  }

  async function handleDelete(id: number) {
    await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead(userId);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <PageHeader
          title="Notifications"
          subtitle={`${notifications.length} notification${notifications.length !== 1 ? "s" : ""}${unread > 0 ? ` · ${unread} unread` : ""}`}
        />
        {unread > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-4 py-2 border border-[#e2e8f0] text-sm font-medium rounded-lg text-[#64748b] hover:bg-white hover:shadow-sm transition-all"
          >
            <CheckCheck className="h-4 w-4" /> Mark All Read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#94a3b8]" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 text-[#94a3b8]">
          <Bell className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p className="font-medium text-[#0e212c]">No notifications</p>
          <p className="text-sm mt-1">You&apos;re all caught up!</p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`bg-white border border-[#e2e8f0] rounded-xl p-4 flex items-start gap-4 transition-all hover:shadow-sm ${
                !n.isRead ? "border-l-4 border-l-[#fd761a]" : ""
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  n.isRead
                    ? "bg-[#f1f5f9] text-[#94a3b8]"
                    : "bg-amber-50 text-amber-600"
                }`}
              >
                <Bell className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p
                    className={`text-sm ${n.isRead ? "text-[#64748b]" : "text-[#0e212c] font-medium"}`}
                  >
                    {n.systemNotification}
                  </p>
                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-[#fd761a] shrink-0" />
                  )}
                </div>
                <p className="text-xs text-[#94a3b8] mt-0.5">{n.message}</p>
                <p className="text-[10px] text-[#94a3b8] mt-1">
                  {new Date(n.createdAt).toLocaleString("en-PH")}
                </p>
              </div>
              {!n.isRead && (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  className="p-1.5 text-[#94a3b8] hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all shrink-0"
                  title="Mark as read"
                >
                  <CheckCircle className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => handleDelete(n.id)}
                className="p-1.5 text-[#94a3b8] hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all shrink-0"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
