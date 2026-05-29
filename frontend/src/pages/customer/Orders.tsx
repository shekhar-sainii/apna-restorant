import React, { useEffect, useState, useCallback } from "react";
import {
  CheckCircle,
  Clock,
  Truck,
  ChevronRight,
  Loader2,
  Package,
  XCircle,
  LogIn,
} from "lucide-react";
import { Link } from "react-router-dom";
import orderService, { type Order, type OrderStatus } from "../../services/orderService";
import { formatDate } from "../../utils/format";
import { useAuth } from "../../context/AuthContext";
import { getGuestOrders } from "../../utils/guestSession";
import { Button } from "../../components/common/Button";

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; className: string; icon: React.ElementType }
> = {
  pending: {
    label: "Pending",
    className: "bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-350",
    icon: Clock,
  },
  accepted: {
    label: "Accepted",
    className: "bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-350",
    icon: Clock,
  },
  preparing: {
    label: "Preparing",
    className: "bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-350",
    icon: Clock,
  },
  ready: {
    label: "Ready",
    className: "bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-350",
    icon: Package,
  },
  out_for_delivery: {
    label: "Out for Delivery",
    className: "bg-indigo-100 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-350",
    icon: Truck,
  },
  delivered: {
    label: "Delivered",
    className: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-350",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-350",
    icon: XCircle,
  },
};

function formatItemsSummary(items: Order["items"]) {
  return items.map((i) => `${i.name} ×${i.quantity}`).join(", ");
}

export const Orders: React.FC = () => {
  const { isAuthenticated, isGuest } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isAuthenticated) {
        const res = await orderService.getMyOrders({ limit: 20 });
        setOrders(res.data ?? []);
      } else {
        const saved = getGuestOrders();
        if (saved.length === 0) {
          setOrders([]);
          return;
        }
        const guestSessionId = localStorage.getItem("ar_guest_session_id") ?? undefined;
        const fetched = await Promise.all(
          saved.map(async (s) => {
            try {
              const res = await orderService.getById(s.id, guestSessionId);
              return res.data;
            } catch {
              return null;
            }
          })
        );
        setOrders(fetched.filter((o): o is Order => o !== null));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const getStatusBadge = (status: OrderStatus) => {
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
    const Icon = cfg.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${cfg.className}`}>
        <Icon className="w-3.5 h-3.5" />
        {cfg.label}
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-200">Your Orders</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          {isGuest
            ? "Orders placed on this device as a guest"
            : "Track your current orders or review previous ones"}
        </p>
      </div>

      {isGuest && (
        <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Login to see all orders across devices.
          </p>
          <Link to="/login">
            <Button variant="secondary" className="!py-2 !px-4 text-xs flex items-center gap-1.5">
              <LogIn className="w-3.5 h-3.5" />
              Login
            </Button>
          </Link>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-600 text-sm font-semibold">
          {error}
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl">
          <p className="text-slate-500 mb-4">No orders yet.</p>
          <Link to="/menu" className="text-orange-500 font-bold hover:underline">
            Browse Menu
          </Link>
        </div>
      )}

      {!loading && orders.length > 0 && (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl shadow-sm hover:border-orange-500/30 transition-all"
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-extrabold text-lg text-slate-800 dark:text-slate-200">
                    {order.orderNumber}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    {formatDate(order.createdAt)}
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  {formatItemsSummary(order.items)}
                </p>
                <div className="font-black text-slate-800 dark:text-slate-100 text-base mt-1">
                  ₹{order.totalAmount}
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-4 mt-2 md:mt-0 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 dark:border-slate-800">
                {getStatusBadge(order.status)}
                <Link
                  to={`/orders/${order._id}/track`}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 transition-all"
                >
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default Orders;
