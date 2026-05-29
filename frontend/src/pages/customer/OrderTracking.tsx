import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  CheckCircle,
  Clock,
  Truck,
  ChefHat,
  MapPin,
  Loader2,
  Package,
  XCircle,
} from "lucide-react";
import orderService, { type Order, type OrderStatus } from "../../services/orderService";
import { useAuth } from "../../context/AuthContext";
import { getOrCreateGuestSessionId } from "../../utils/guestSession";

const TRACKING_STEPS: { status: OrderStatus; label: string; icon: React.ElementType }[] = [
  { status: "pending", label: "Order Placed", icon: CheckCircle },
  { status: "accepted", label: "Order Accepted", icon: CheckCircle },
  { status: "preparing", label: "Being Prepared", icon: ChefHat },
  { status: "ready", label: "Ready", icon: Package },
  { status: "out_for_delivery", label: "Out for Delivery", icon: Truck },
  { status: "delivered", label: "Delivered", icon: MapPin },
];

const STATUS_ORDER: OrderStatus[] = TRACKING_STEPS.map((s) => s.status);

function stepIndex(status: OrderStatus): number {
  if (status === "cancelled") return -1;
  const idx = STATUS_ORDER.indexOf(status);
  return idx >= 0 ? idx : 0;
}

function formatAddress(addr: Order["deliveryAddress"]) {
  if (!addr) return "—";
  const parts = [addr.line1, addr.line2, addr.landmark, addr.city, addr.pincode].filter(Boolean);
  return parts.join(", ");
}

export const OrderTracking: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isGuest } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const guestSessionId = isGuest ? getOrCreateGuestSessionId() : undefined;
        const res = await orderService.getById(id, guestSessionId);
        setOrder(res.data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load order");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isGuest]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 font-semibold mb-4">{error ?? "Order not found"}</p>
        <Link to="/orders" className="text-orange-500 font-bold hover:underline">
          ← Back to Orders
        </Link>
      </div>
    );
  }

  const currentIdx = stepIndex(order.status);
  const isCancelled = order.status === "cancelled";

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto">
      <div>
        <Link to="/orders" className="text-sm text-orange-500 font-semibold hover:underline mb-2 inline-block">
          ← All Orders
        </Link>
        <h2 className="text-3xl font-black text-slate-800 dark:text-slate-200">Track Order</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          Live status of your order{" "}
          <span className="text-orange-500 font-bold">{order.orderNumber}</span>
        </p>
      </div>

      {isCancelled ? (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-600">
          <XCircle className="w-5 h-5" />
          <span className="font-bold text-sm">This order was cancelled</span>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col gap-0">
            {TRACKING_STEPS.map((step, index) => {
              const Icon = step.icon;
              const done = index <= currentIdx;
              const isActive = index === currentIdx;
              const isLast = index === TRACKING_STEPS.length - 1;
              return (
                <div key={step.status} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                        done
                          ? "bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/20"
                          : "bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400"
                      } ${isActive ? "ring-4 ring-orange-500/20" : ""}`}
                    >
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    {!isLast && (
                      <div
                        className={`w-0.5 h-10 mt-1 ${done && index < currentIdx ? "bg-orange-400" : "bg-slate-200 dark:bg-slate-800"}`}
                      />
                    )}
                  </div>
                  <div className="pt-2.5 pb-6">
                    <p
                      className={`font-extrabold text-sm ${done ? "text-slate-800 dark:text-slate-200" : "text-slate-400 dark:text-slate-600"}`}
                    >
                      {step.label}
                    </p>
                    {isActive && (
                      <p className="text-xs text-orange-500 font-semibold mt-0.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse inline-block" />
                        Currently active
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Payment</p>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            <span className="font-extrabold text-lg text-slate-800 dark:text-slate-200 capitalize">
              {order.paymentMethod} · {order.paymentStatus}
            </span>
          </div>
        </div>
        {order.orderType === "delivery" && order.deliveryAddress && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Delivery To</p>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
              <span className="font-bold text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {formatAddress(order.deliveryAddress)}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
        <h3 className="font-black text-base mb-4 text-slate-800 dark:text-slate-200">Order Items</h3>
        <div className="flex flex-col gap-3">
          {order.items.map((item, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-slate-800 last:border-0"
            >
              <div>
                <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{item.name}</p>
                <p className="text-xs text-slate-400">Qty: {item.quantity}</p>
              </div>
              <span className="font-extrabold text-orange-500">₹{item.subtotal ?? item.price * item.quantity}</span>
            </div>
          ))}
          <div className="flex justify-between items-center pt-2 font-black text-base">
            <span className="text-slate-700 dark:text-slate-300">Total</span>
            <span className="text-orange-500 text-lg">₹{order.totalAmount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default OrderTracking;
