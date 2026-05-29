import request from "supertest";
import app from "../app";
import Category from "../models/Category.model";
import MenuItem from "../models/MenuItem.model";

describe("Order API Endpoints", () => {
  let userToken: string;
  let menuItemId: string;

  beforeEach(async () => {
    const userRes = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Order User",
        email: "orderuser@example.com",
        phone: "9876543220",
        password: "password123",
      });
    userToken = userRes.body.data.accessToken;

    const cat = await Category.create({
      name: "Drinks",
      slug: "drinks",
      isActive: true,
    });

    const item = await MenuItem.create({
      name: "Fresh Lime Soda",
      price: 100,
      category: cat._id,
      isVeg: true,
      isAvailable: true,
    });
    menuItemId = (item._id as any).toString();
  });

  describe("POST /api/v1/orders", () => {
    it("should place an order successfully for logged in user", async () => {
      const res = await request(app)
        .post("/api/v1/orders")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          items: [{ menuItemId, quantity: 2 }],
          orderType: "dine-in",
          tableNumber: 5,
          paymentMethod: "cash",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orderNumber).toBeDefined();
      expect(res.body.data.subtotal).toBe(200);
      expect(res.body.data.gstAmount).toBe(10);
      expect(res.body.data.totalAmount).toBe(210);
      expect(res.body.data.paymentStatus).toBe("pending");
      expect(res.body.data.status).toBe("pending");
    });

    it("should allow placing guest orders", async () => {
      const res = await request(app)
        .post("/api/v1/orders")
        .send({
          items: [{ menuItemId, quantity: 1 }],
          orderType: "takeaway",
          paymentMethod: "cash",
          guestSessionId: "guest-uuid-123",
          guestName: "Guest User",
          guestPhone: "9876543221",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isGuestOrder).toBe(true);
      expect(res.body.data.guestName).toBe("Guest User");
      expect(res.body.data.totalAmount).toBe(105);
    });

    it("should fail when menuItem is not found", async () => {
      const res = await request(app)
        .post("/api/v1/orders")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          items: [{ menuItemId: "6a19503b24b3d58ffc916aef", quantity: 2 }],
          orderType: "dine-in",
          tableNumber: 5,
          paymentMethod: "cash",
        });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/v1/orders/:id", () => {
    it("should retrieve placing user's order successfully", async () => {
      const orderRes = await request(app)
        .post("/api/v1/orders")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          items: [{ menuItemId, quantity: 1 }],
          orderType: "dine-in",
          tableNumber: 5,
          paymentMethod: "cash",
        });

      const orderId = orderRes.body.data._id;

      const res = await request(app)
        .get(`/api/v1/orders/${orderId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orderNumber).toBe(orderRes.body.data.orderNumber);
    });
  });
});
