export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  isVeg: boolean;
  selectedSize?: string;
}

export interface CartPricing {
  subtotal: number;
  gst: number;
  deliveryCharge: number;
  discount: number;
  total: number;
}

export const CART_STORAGE_KEY = "ar_cart";

export const DEFAULT_GST_PERCENT = 5;
export const DEFAULT_DELIVERY_CHARGE = 40;
export const DEFAULT_FREE_DELIVERY_ABOVE = 500;
