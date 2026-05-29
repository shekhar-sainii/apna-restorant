import React from "react";
import { Truck } from "lucide-react";
import type { CartItem } from "../../types/cart";
import type { CartPricing } from "../../types/cart";

interface OrderSummaryProps {
  items: CartItem[];
  pricing: CartPricing;
  appliedCouponCode?: string;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  items,
  pricing,
  appliedCouponCode,
}) => {
  const { subtotal, gst, deliveryCharge, discount, total } = pricing;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
      <h3 className="font-black text-base mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-200">
        <Truck className="w-4 h-4 text-orange-500" />
        Order Summary
      </h3>
      <div className="flex flex-col gap-2 mb-4">
        {items.map((item) => (
          <div key={`${item.menuItemId}-${item.selectedSize}`} className="flex justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400">
              {item.name} × {item.quantity}
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              ₹{item.price * item.quantity}
            </span>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col gap-2 text-sm">
        <div className="flex justify-between text-slate-500 dark:text-slate-400">
          <span>Subtotal</span>
          <span className="font-bold text-slate-700 dark:text-slate-300">₹{subtotal}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
            <span>Coupon {appliedCouponCode ? `(${appliedCouponCode})` : ""}</span>
            <span className="font-bold">−₹{discount}</span>
          </div>
        )}
        <div className="flex justify-between text-slate-500 dark:text-slate-400">
          <span>GST (5%)</span>
          <span className="font-bold text-slate-700 dark:text-slate-300">₹{gst}</span>
        </div>
        <div className="flex justify-between text-slate-500 dark:text-slate-400">
          <span>Delivery</span>
          <span
            className={`font-bold ${deliveryCharge === 0 ? "text-emerald-500" : "text-slate-700 dark:text-slate-300"}`}
          >
            {deliveryCharge === 0 ? "FREE" : `₹${deliveryCharge}`}
          </span>
        </div>
        <div className="flex justify-between font-black text-base mt-2 border-t border-slate-100 dark:border-slate-800 pt-3">
          <span className="text-slate-800 dark:text-slate-200">Total</span>
          <span className="text-orange-500 text-lg">₹{total}</span>
        </div>
      </div>
    </div>
  );
};
