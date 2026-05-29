export interface IPayment {
  _id: string;
  order: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  amount: number; // in paise
  currency: string;
  status: "created" | "authorized" | "captured" | "failed" | "refunded";
  method?: string;
  webhookPayload?: any;
  verifiedAt?: string;
  createdAt: string;
}
