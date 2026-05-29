import type { CartItem, CartPricing } from "../types/cart";
import {
  DEFAULT_DELIVERY_CHARGE,
  DEFAULT_FREE_DELIVERY_ABOVE,
  DEFAULT_GST_PERCENT,
} from "../types/cart";

export function calculateCartPricing(
  items: CartItem[],
  opts?: {
    gstPercent?: number;
    deliveryCharge?: number;
    freeDeliveryAbove?: number;
    couponDiscount?: number;
    orderType?: "delivery" | "takeaway" | "dine-in";
  }
): CartPricing {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const gstPercent = opts?.gstPercent ?? DEFAULT_GST_PERCENT;
  const deliveryFlat = opts?.deliveryCharge ?? DEFAULT_DELIVERY_CHARGE;
  const freeAbove = opts?.freeDeliveryAbove ?? DEFAULT_FREE_DELIVERY_ABOVE;
  const orderType = opts?.orderType ?? "delivery";
  const discount = Math.min(opts?.couponDiscount ?? 0, subtotal);

  const gst = Math.round((subtotal * gstPercent) / 100);
  let deliveryCharge = 0;
  if (orderType === "delivery") {
    deliveryCharge = subtotal === 0 || subtotal >= freeAbove ? 0 : deliveryFlat;
  }
  const total = Math.max(0, subtotal + gst + deliveryCharge - discount);

  return { subtotal, gst, deliveryCharge, discount, total };
}
