# 09 — Payment Module

> Razorpay Integration, Webhook Verification, Dynamic QR, Cash Flow

---

## 1. Razorpay Setup

### Get API Keys

1. Create account at https://razorpay.com
2. Dashboard → Settings → API Keys → Generate Key
3. Note: `KEY_ID` and `KEY_SECRET`
4. Dashboard → Settings → Webhooks → Add webhook URL: `https://yourdomain.com/api/v1/payments/webhook`
5. Select event: `payment.captured`
6. Note: Webhook secret

### `src/config/razorpay.js`

```js
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

module.exports = razorpay;
```

---

## 2. Payment Model — `src/models/Payment.model.js`

```js
const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  razorpayOrderId: { type: String, unique: true, sparse: true },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  amount: Number,     // in paise
  currency: { type: String, default: "INR" },
  status: {
    type: String,
    enum: ["created", "authorized", "captured", "failed", "refunded"],
    default: "created",
  },
  method: String,     // upi, card, netbanking
  webhookPayload: mongoose.Schema.Types.Mixed,
  verifiedAt: Date,
  createdAt: { type: Date, default: Date.now },
});

paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ order: 1 });

module.exports = mongoose.model("Payment", paymentSchema);
```

---

## 3. Payment Repository — `src/modules/payment/payment.repository.js`

```js
const Payment = require("../../models/Payment.model");
const Order = require("../../models/Order.model");

class PaymentRepository {
  async createPaymentRecord(data) {
    return Payment.create(data);
  }

  async findByRazorpayOrderId(razorpayOrderId) {
    return Payment.findOne({ razorpayOrderId }).populate("order");
  }

  async updateByRazorpayOrderId(razorpayOrderId, data) {
    return Payment.findOneAndUpdate({ razorpayOrderId }, data, { new: true });
  }

  async findByOrderId(orderId) {
    return Payment.findOne({ order: orderId });
  }

  async updateOrderPaymentStatus(orderId, status, razorpayPaymentId) {
    return Order.findByIdAndUpdate(
      orderId,
      { paymentStatus: status, razorpayPaymentId },
      { new: true }
    );
  }
}

module.exports = new PaymentRepository();
```

---

## 4. Payment Service — `src/modules/payment/payment.service.js`

```js
const crypto = require("crypto");
const razorpay = require("../../config/razorpay");
const paymentRepository = require("./payment.repository");
const orderRepository = require("../order/order.repository");
const notificationService = require("../notification/notification.service");
const socketService = require("../../services/socket.service");
const ApiError = require("../../utils/ApiError");

class PaymentService {
  // Step 1: Create Razorpay order
  async createOrder(orderId) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw ApiError.notFound("Order not found");

    if (order.paymentMethod !== "online") {
      throw ApiError.badRequest("Order is not set for online payment");
    }

    if (order.paymentStatus === "paid") {
      throw ApiError.conflict("Order already paid");
    }

    const amountInPaise = Math.round(order.totalAmount * 100);

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: order.orderNumber,
      notes: {
        orderId: orderId.toString(),
        orderNumber: order.orderNumber,
      },
    });

    // Save razorpayOrderId to our order
    await orderRepository.updatePaymentStatus(orderId, "pending", null);
    await Order.findByIdAndUpdate(orderId, { razorpayOrderId: razorpayOrder.id });

    // Create payment record
    await paymentRepository.createPaymentRecord({
      order: orderId,
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise,
      status: "created",
    });

    return {
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
    };
  }

  // Step 2: Verify payment signature (called from frontend after payment)
  async verifyPayment({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      throw ApiError.badRequest("Payment verification failed");
    }

    // Update payment record
    const payment = await paymentRepository.findByRazorpayOrderId(razorpayOrderId);
    if (!payment) throw ApiError.notFound("Payment record not found");

    await paymentRepository.updateByRazorpayOrderId(razorpayOrderId, {
      razorpayPaymentId,
      razorpaySignature,
      status: "captured",
      verifiedAt: new Date(),
    });

    // Update order payment status
    await paymentRepository.updateOrderPaymentStatus(payment.order._id, "paid", razorpayPaymentId);

    // Socket notification
    socketService.emitToOrderRoom(payment.order._id.toString(), "payment-success", {
      orderId: payment.order._id,
      paymentId: razorpayPaymentId,
    });
    socketService.emitToAdmins("payment-success", {
      orderId: payment.order._id,
      paymentId: razorpayPaymentId,
    });

    // Notification
    if (payment.order.customer) {
      await notificationService.createForUser({
        userId: payment.order.customer,
        type: "payment_success",
        title: "Payment Successful ✓",
        message: `Payment of ₹${payment.order.totalAmount} received`,
        orderId: payment.order._id,
      });
    }

    return payment.order;
  }

  // Step 3: Webhook — Razorpay calls this server-to-server
  // This is the AUTHORITATIVE verification — never trust only frontend
  async handleWebhook(rawBody, signature) {
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      throw ApiError.badRequest("Invalid webhook signature");
    }

    const payload = JSON.parse(rawBody.toString());
    const event = payload.event;

    if (event === "payment.captured") {
      const razorpayPaymentId = payload.payload.payment.entity.id;
      const razorpayOrderId = payload.payload.payment.entity.order_id;

      const payment = await paymentRepository.findByRazorpayOrderId(razorpayOrderId);
      if (!payment) return; // Already handled or unknown

      if (payment.status === "captured") return; // Idempotent

      await paymentRepository.updateByRazorpayOrderId(razorpayOrderId, {
        razorpayPaymentId,
        status: "captured",
        method: payload.payload.payment.entity.method,
        webhookPayload: payload,
        verifiedAt: new Date(),
      });

      await paymentRepository.updateOrderPaymentStatus(payment.order._id, "paid", razorpayPaymentId);

      // Auto-accept order after payment
      const Order = require("../../models/Order.model");
      const order = await Order.findById(payment.order._id);
      if (order && order.status === "pending") {
        await Order.findByIdAndUpdate(payment.order._id, {
          status: "accepted",
          $push: {
            statusHistory: { status: "accepted", updatedAt: new Date(), note: "Auto-accepted after payment" },
          },
        });
      }

      socketService.emitToOrderRoom(payment.order._id.toString(), "payment-success", {
        orderId: payment.order._id,
      });
    }

    if (event === "payment.failed") {
      const razorpayOrderId = payload.payload.payment.entity.order_id;
      const payment = await paymentRepository.findByRazorpayOrderId(razorpayOrderId);
      if (payment) {
        await paymentRepository.updateByRazorpayOrderId(razorpayOrderId, { status: "failed" });
        await paymentRepository.updateOrderPaymentStatus(payment.order._id, "failed", null);

        socketService.emitToOrderRoom(payment.order._id.toString(), "payment-failed", {
          orderId: payment.order._id,
          reason: "Payment failed",
        });
      }
    }
  }
}

module.exports = new PaymentService();
```

---

## 5. Payment Controller — `src/modules/payment/payment.controller.js`

```js
const paymentService = require("./payment.service");
const paymentRepository = require("./payment.repository");
const ApiResponse = require("../../utils/ApiResponse");
const asyncHandler = require("../../utils/asyncHandler");

const createOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const data = await paymentService.createOrder(orderId);
  return ApiResponse.success(res, "Razorpay order created", data);
});

const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  const order = await paymentService.verifyPayment({
    razorpayOrderId, razorpayPaymentId, razorpaySignature,
  });
  return ApiResponse.success(res, "Payment verified successfully", order);
});

// Raw body — must be registered BEFORE express.json() in app.js
const webhook = asyncHandler(async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  await paymentService.handleWebhook(req.body, signature);
  res.json({ received: true }); // Always respond 200 to Razorpay
});

const getPaymentDetails = asyncHandler(async (req, res) => {
  const payment = await paymentRepository.findByOrderId(req.params.orderId);
  return ApiResponse.success(res, "Payment details", payment);
});

module.exports = { createOrder, verifyPayment, webhook, getPaymentDetails };
```

---

## 6. Payment Routes — `src/modules/payment/payment.routes.js`

```js
const router = require("express").Router();
const ctrl = require("./payment.controller");
const { authenticate } = require("../../middleware/auth.middleware");
const { requireRole } = require("../../middleware/role.middleware");

// Webhook needs raw body — app.js handles this with express.raw() for this path
router.post("/webhook", ctrl.webhook);

router.post("/create-order", ctrl.createOrder);
router.post("/verify", ctrl.verifyPayment);
router.get("/order/:orderId", authenticate, requireRole("admin"), ctrl.getPaymentDetails);

module.exports = router;
```

---

## 7. Frontend: Razorpay Integration

### Install Razorpay Script

In `index.html`:
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

### `src/components/payment/RazorpayButton.tsx`

```tsx
import { useState } from "react";
import { useDispatch } from "react-redux";
import { clearCart } from "../../features/cart/cartSlice";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface Props {
  orderId: string;
  orderNumber: string;
  amount: number;
  userName?: string;
  userPhone?: string;
  userEmail?: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const RazorpayButton = ({ orderId, orderNumber, amount, userName, userPhone, userEmail }: Props) => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handlePayment = async () => {
    setLoading(true);
    try {
      // 1. Create Razorpay order on backend
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/payments/create-order`,
        { orderId }
      );

      const { razorpayOrderId, amount: amountPaise, keyId } = data.data;

      // 2. Open Razorpay checkout
      const options = {
        key: keyId,
        amount: amountPaise,
        currency: "INR",
        name: "Restaurant Name",
        description: `Order ${orderNumber}`,
        order_id: razorpayOrderId,
        prefill: {
          name: userName || "",
          contact: userPhone || "",
          email: userEmail || "",
        },
        theme: { color: "#f97316" }, // Orange theme

        handler: async (response: any) => {
          // 3. Verify on backend
          try {
            await axios.post(`${import.meta.env.VITE_API_URL}/payments/verify`, {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            dispatch(clearCart());
            navigate(`/order-tracking/${orderId}?payment=success`);
          } catch {
            navigate(`/order-tracking/${orderId}?payment=failed`);
          }
        },

        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment error:", err);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl transition disabled:opacity-60"
    >
      {loading ? "Processing..." : `Pay ₹${amount}`}
    </button>
  );
};

export default RazorpayButton;
```

---

## 8. Payment Flow Summary

```
Customer clicks "Pay Online"
       │
       ▼
Frontend: POST /api/v1/payments/create-order { orderId }
       │
       ▼
Backend creates Razorpay Order → returns { razorpayOrderId, amount, keyId }
       │
       ▼
Frontend opens Razorpay modal (UPI/Card/NetBanking options)
       │
       ▼
Customer pays via UPI/PhonePe/GPay/Paytm/Card
       │
       ├─── Razorpay Webhook → POST /api/v1/payments/webhook (server-to-server)
       │         │
       │         ▼
       │    Backend verifies HMAC signature
       │         │
       │         ▼
       │    Updates DB: paymentStatus = "paid"
       │         │
       │         ▼
       │    Socket: payment-success → customer + admin
       │
       └─── Frontend handler (razorpay modal callback)
                 │
                 ▼
           POST /api/v1/payments/verify (double verification)
                 │
                 ▼
           Navigate to order tracking
```

---

## 9. Cash Payment Flow

```
Customer selects "Cash"
       │
       ▼
POST /api/v1/orders { paymentMethod: "cash" }
       │
       ▼
Order created with paymentStatus: "pending"
       │
       ├── Dine-in: Pay at restaurant when food arrives
       └── Delivery: Pay delivery person on arrival
       
Staff marks order "delivered" → Admin marks payment received manually
(Or auto-mark paid on delivery if you want)
```

---

## Next → `10-socket-module.md`
