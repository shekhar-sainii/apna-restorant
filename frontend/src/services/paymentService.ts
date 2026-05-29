import fetchApi from "./api";

export interface RazorpayOrderData {
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export const paymentService = {
  createRazorpayOrder: (orderId: string): Promise<{ data: RazorpayOrderData }> =>
    fetchApi("/payments/create-order", {
      method: "POST",
      body: JSON.stringify({ orderId }),
    }),

  verifyPayment: (payload: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) =>
    fetchApi("/payments/verify", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export default paymentService;
