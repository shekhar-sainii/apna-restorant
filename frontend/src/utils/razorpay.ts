import type { RazorpayOrderData } from "../services/paymentService";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

let scriptPromise: Promise<void> | null = null;

function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Razorpay failed to load")));
      return;
    }

    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay failed to load"));
    document.body.appendChild(script);
  });

  return scriptPromise;
}

export async function openRazorpayCheckout(
  orderData: RazorpayOrderData,
  opts: {
    name: string;
    email?: string;
    phone?: string;
    description: string;
    onSuccess: (response: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }) => void;
    onDismiss?: () => void;
  }
): Promise<void> {
  await loadRazorpayScript();

  if (!window.Razorpay) {
    throw new Error("Razorpay is not available");
  }

  const rzp = new window.Razorpay({
    key: orderData.keyId,
    amount: orderData.amount,
    currency: orderData.currency,
    name: "Apna Restorant",
    description: opts.description,
    order_id: orderData.razorpayOrderId,
    prefill: {
      name: opts.name,
      email: opts.email,
      contact: opts.phone,
    },
    theme: { color: "#f97316" },
    handler: (response: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }) => opts.onSuccess(response),
    modal: {
      ondismiss: () => opts.onDismiss?.(),
    },
  });

  rzp.open();
}
