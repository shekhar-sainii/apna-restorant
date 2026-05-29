import Razorpay from "razorpay";

// Lazily instantiated so env vars are read after dotenv.config() runs
let _instance: Razorpay | null = null;

export const getRazorpay = (): Razorpay => {
  if (!_instance) {
    _instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }
  return _instance;
};

export default getRazorpay;
