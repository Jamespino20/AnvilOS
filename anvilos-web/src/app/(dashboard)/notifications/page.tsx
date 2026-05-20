import { getNotifications } from "@/actions";
import { Bell, CheckCheck, Package, AlertTriangle, Info } from "lucide-react";
import Link from "next/link";

export default async function NotificationsPage() {
  const notifications = await getNotifications();

  function icon(type: string) {
    if (type.startsWith("Stock")) return <Package className="h-4 w-4" />;
    if (type.startsWith("Alert")) return <AlertTriangle className="h-4 w-4 text-error" />;
    return <Info className="h-4 w-4 text-primary" />;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-on-surface">Notifications</h1>
        <button className="flex items-center gap-2 px-4 py-2 border border-outline text-sm rounded hover:bg-surface-container-low transition-colors">
          <CheckCheck className="h-4 w-4" /> Mark All Read
        </button>
      </div>

      <div className="space-y-2">
        {notifications.map((n) => (
          <div key={n.id} className={`bg-white border border-outline rounded p-4 flex items-start gap-4 ${!n.isRead ? "border-l-4 border-l-primary" : ""}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              n.systemNotification.startsWith("Stock") ? "bg-secondary-container/20" :
              n.systemNotification.startsWith("Alert") ? "bg-error-container/30" : "bg-primary-fixed"
            }`}>
              {icon(n.systemNotification)}
            </div>
            <div className="flex-1">
              <p className="text-sm">{n.message}</p>
              <p className="text-xs text-on-surface-variant mt-1">{new Date(n.createdAt).toLocaleString("en-PH")}</p>
            </div>
            {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />}
          </div>
        ))}
        {notifications.length === 0 && (
          <div className="text-center py-12 text-on-surface-variant">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No notifications yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
