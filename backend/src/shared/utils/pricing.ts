export interface PricingInput {
  items: Array<{ price: number; quantity: number }>;
  orderType: "dine-in" | "delivery" | "takeaway";
  gstPercent?: number;
  deliveryCharge?: number;
  freeDeliveryAbove?: number;
  couponDiscount?: number;
}

export interface PricingResult {
  subtotal: number;
  gstAmount: number;
  deliveryCharge: number;
  discountAmount: number;
  totalAmount: number;
}

export const calculatePricing = ({
  items,
  orderType,
  gstPercent = 5,
  deliveryCharge = 0,
  freeDeliveryAbove = 0,
  couponDiscount = 0,
}: PricingInput): PricingResult => {
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const gstAmount = Math.round((subtotal * gstPercent) / 100 * 100) / 100;

  let actualDeliveryCharge = 0;
  if (orderType === "delivery") {
    actualDeliveryCharge =
      freeDeliveryAbove > 0 && subtotal >= freeDeliveryAbove
        ? 0
        : deliveryCharge;
  }

  const discountAmount = Math.min(couponDiscount, subtotal);

  const totalAmount =
    Math.round(
      (subtotal + gstAmount + actualDeliveryCharge - discountAmount) * 100
    ) / 100;

  return {
    subtotal,
    gstAmount,
    deliveryCharge: actualDeliveryCharge,
    discountAmount,
    totalAmount,
  };
};
