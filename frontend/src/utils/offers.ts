import type { Coupon } from "../services/couponService";

export const PENDING_COUPON_KEY = "ar_pending_coupon";

export interface PromoOffer {
  id: string;
  title: string;
  subtitle: string;
  code?: string;
  emoji: string;
  gradient: string;
}

export const STATIC_PROMOS: PromoOffer[] = [
  {
    id: "free-delivery",
    title: "FREE Delivery",
    subtitle: "On orders above ₹500",
    emoji: "🛵",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    id: "fast-prep",
    title: "Fresh & Fast",
    subtitle: "Hot food in 30 mins",
    emoji: "⚡",
    gradient: "from-violet-500 to-purple-600",
  },
];

const GRADIENTS = [
  "from-orange-500 to-red-500",
  "from-pink-500 to-rose-600",
  "from-amber-500 to-orange-600",
  "from-blue-500 to-indigo-600",
  "from-cyan-500 to-blue-600",
  "from-fuchsia-500 to-pink-600",
];

export function couponToPromo(coupon: Coupon, index: number): PromoOffer {
  const title =
    coupon.type === "flat"
      ? `₹${coupon.value} OFF`
      : `${coupon.value}% OFF`;

  let subtitle = `Orders ₹${coupon.minOrderAmount}+`;
  if (coupon.type === "percentage" && coupon.maxDiscount) {
    subtitle += ` · upto ₹${coupon.maxDiscount}`;
  }

  return {
    id: coupon._id,
    title,
    subtitle,
    code: coupon.code,
    emoji: coupon.type === "flat" ? "💰" : "🎉",
    gradient: GRADIENTS[index % GRADIENTS.length],
  };
}

export function savePendingCoupon(code: string) {
  localStorage.setItem(PENDING_COUPON_KEY, code.toUpperCase());
}

export function consumePendingCoupon(): string | null {
  const code = localStorage.getItem(PENDING_COUPON_KEY);
  if (code) localStorage.removeItem(PENDING_COUPON_KEY);
  return code;
}
