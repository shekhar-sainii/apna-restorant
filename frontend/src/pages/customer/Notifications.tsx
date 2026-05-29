import React, { useState, useEffect, useCallback } from "react";
import { Bell, CheckCheck, ShoppingBag, Tag, Settings, AlertCircle } from "lucide-react";
import notificationService from "../../services/notificationService";
import type { AppNotification } from "../../services/notificationService";

const TYPE_COLORS: Record<string, string> = {
  new_order:      "bg-blue-500/10 text-blue-500",
  order_status:   "bg-purple-500/10 text-purple-500",
  payment_success:"bg-emerald-500/10 text-emerald-500",
  system:         "bg-slate-500/10 text-slate-500",
  promo:          "bg-amber-500/10 text-amber-500",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  new_order:      <ShoppingBag className="w-4 h-4" />,
  order_status:   <ShoppingBag className="w-4 h-4" />,
  payment_success:<Tag className="w-4 h-4" />,
  system:         <Settings className="w-4 h-4" />,
  promo:          <Tag className="w-4 h-4" />,
};

export const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await notificationService.getAll();
      setNotifications(res.data ?? []);
    } catch (err: any) {
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch { /* silent */ }
  };

  const markOne = async (id: string) => {
    try {
      await notificationService.markRead(id);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
    } catch { /* silent */ }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-slate-200">Notifications</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {unreadCount > 0
              ? <span><span className="text-orange-500 font-bold">{unreadCount} unread</span> notifications</span>
              : "You're all caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-xs font-bold text-orange-500 hover:underline flex items-center gap-1 mt-1 cursor-pointer">
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 text-red-600 text-sm font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl">
          <div className="inline-flex p-4 rounded-full bg-slate-100 dark:bg-slate-950 text-slate-400 mb-4">
            <Bell className="w-8 h-8" />
          </div>
          <h3 className="font-extrabold text-slate-700 dark:text-slate-300 mb-1">No Notifications</h3>
          <p className="text-sm text-slate-400">New alerts will show up here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map((notif) => (
            <div
              key={notif._id}
              onClick={() => !notif.isRead && markOne(notif._id)}
              className={`flex items-start gap-4 p-5 rounded-2xl border transition-all cursor-pointer ${
                !notif.isRead
                  ? "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 shadow-sm"
                  : "bg-slate-50/50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800/40"
              }`}
            >
              <div className={`p-2.5 rounded-xl flex-shrink-0 ${TYPE_COLORS[notif.type] ?? "bg-slate-500/10 text-slate-500"}`}>
                {TYPE_ICONS[notif.type] ?? <Bell className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`font-extrabold text-sm ${!notif.isRead ? "text-slate-800 dark:text-slate-200" : "text-slate-500 dark:text-slate-400"}`}>
                    {notif.title}
                  </p>
                  {!notif.isRead && <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0 mt-1" />}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{notif.message}</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-2">
                  {new Date(notif.createdAt).toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default Notifications;
