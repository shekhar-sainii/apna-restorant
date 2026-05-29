import request from "supertest";
import crypto from "crypto";
import app from "../app";
import Order from "../models/Order.model";
import Payment from "../models/Payment.model";
import Category from "../models/Category.model";
import MenuItem from "../models/MenuItem.model";

import getRazorpay from "../config/razorpay";

const mockRazorpayInstance = {
  orders: { create: jest.fn() },
};

jest.mock("../config/razorpay", () => ({
  __esModule: true,
  default: jest.fn(() => mockRazorpayInstance),
}));

describe("Payment API Endpoints", () => {
  let userToken: string;
  let orderId: string;

  beforeEach(async () => {
    (mockRazorpayInstance.orders.create as jest.Mock).mockResolvedValue({
      id: "rzp_order_test_123",
      amount: 21000,
      currency: "INR",
      receipt: "ORD-TEST-9999",
    });

    const userRes = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Payment User",
        email: "paymentuser@example.com",
        phone: "9876543230",
        password: "password123",
      });
    userToken = userRes.body.data.accessToken;

    const cat = await Category.create({
      name: "Desserts",
      slug: "desserts",
      isActive: true,
    });
    const item = await MenuItem.create({
      name: "Chocolate Lava Cake",
      price: 200,
      category: cat._id,
      isVeg: true,
      isAvailable: true,
    });

    const orderRes = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        items: [{ menuItemId: item._id, quantity: 1 }],
        orderType: "takeaway",
        paymentMethod: "online",
      });

    orderId = orderRes.body.data._id;
  });

  describe("POST /api/v1/payments/create-order", () => {
    it("should successfully create a Razorpay order record", async () => {
      const res = await request(app)
        .post("/api/v1/payments/create-order")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ orderId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.razorpayOrderId).toBe("rzp_order_test_123");
      expect(res.body.data.amount).toBe(21000);

      const payment = await Payment.findOne({ order: orderId });
      expect(payment).toBeDefined();
      expect(payment?.status).toBe("created");
      expect(payment?.razorpayOrderId).toBe("rzp_order_test_123");
    });
  });

  describe("POST /api/v1/payments/verify", () => {
    it("should verify payment successfully with valid signature", async () => {
      await request(app)
        .post("/api/v1/payments/create-order")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ orderId });

      const rzpOrderId = "rzp_order_test_123";
      const rzpPaymentId = "pay_test_999";
      process.env.RAZORPAY_KEY_SECRET = "test_secret";

      const signature = crypto
        .createHmac("sha256", "test_secret")
        .update(`${rzpOrderId}|${rzpPaymentId}`)
        .digest("hex");

      const res = await request(app)
        .post("/api/v1/payments/verify")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          razorpayOrderId: rzpOrderId,
          razorpayPaymentId: rzpPaymentId,
          razorpaySignature: signature,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const order = await Order.findById(orderId);
      expect(order?.paymentStatus).toBe("paid");
      expect(order?.razorpayPaymentId).toBe(rzpPaymentId);

      const payment = await Payment.findOne({ order: orderId });
      expect(payment?.status).toBe("captured");
    });
  });

  describe("POST /api/v1/payments/webhook", () => {
    it("should handle payment.captured webhook event from Razorpay", async () => {
      await request(app)
        .post("/api/v1/payments/create-order")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ orderId });

      process.env.RAZORPAY_WEBHOOK_SECRET = "webhook_secret";

      const payload = {
        event: "payment.captured",
        payload: {
          payment: {
            entity: {
              id: "pay_webhook_captured",
              order_id: "rzp_order_test_123",
              method: "upi",
              amount: 21000,
            },
          },
        },
      };

      const payloadStr = JSON.stringify(payload);
      const signature = crypto
        .createHmac("sha256", "webhook_secret")
        .update(payloadStr)
        .digest("hex");

      const res = await request(app)
        .post("/api/v1/payments/webhook")
        .set("x-razorpay-signature", signature)
        .set("Content-Type", "application/json")
        .send(payloadStr);

      expect(res.status).toBe(200);
      expect(res.body.received).toBe(true);

      const order = await Order.findById(orderId);
      expect(order?.paymentStatus).toBe("paid");
      expect(order?.status).toBe("accepted");
    });
  });
});
