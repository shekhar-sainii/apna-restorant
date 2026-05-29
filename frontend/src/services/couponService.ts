import fetchApi from "./api";

export interface Coupon {
  _id: string;
  code: string;
  type: "flat" | "percentage";
  value: number;
  minOrderAmount: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  expiresAt: string;
  isActive: boolean;
}

export interface AppliedCoupon {
  code: string;
  type: "flat" | "percentage";
  value: number;
  discountAmount: number;
}

export const couponService = {
  getActive: (): Promise<{ data: Coupon[] }> => fetchApi("/coupons/active"),

  apply: (code: string, subtotal: number): Promise<{ data: AppliedCoupon }> =>
    fetchApi("/coupons/apply", {
      method: "POST",
      body: JSON.stringify({ code, subtotal }),
    }),

  getAll: (): Promise<{ data: Coupon[] }> => fetchApi("/coupons"),

  create: (data: Partial<Coupon>): Promise<{ data: Coupon }> =>
    fetchApi("/coupons", { method: "POST", body: JSON.stringify(data) }),

  update: (id: string, data: Partial<Coupon>): Promise<{ data: Coupon }> =>
    fetchApi(`/coupons/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  delete: (id: string): Promise<{ data: Coupon }> =>
    fetchApi(`/coupons/${id}`, { method: "DELETE" }),
};

export default couponService;
