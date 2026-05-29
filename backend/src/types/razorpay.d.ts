declare module "razorpay" {
  class Razorpay {
    constructor(options: { key_id: string | undefined; key_secret: string | undefined });
    orders: {
      create(options: {
        amount: number;
        currency: string;
        receipt?: string;
        notes?: Record<string, string>;
      }): Promise<{
        id: string;
        entity: string;
        amount: number;
        amount_paid: number;
        amount_due: number;
        currency: string;
        receipt: string;
        status: string;
        attempts: number;
        notes: Record<string, string>;
        created_at: number;
      }>;
    };
  }
  export = Razorpay;
}
