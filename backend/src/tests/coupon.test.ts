import request from "supertest";
import app from "../app";
import Coupon from "../models/Coupon.model";

describe("Coupon API Endpoints", () => {
  let adminToken: string;
  let userToken: string;
  let couponId: string;

  beforeEach(async () => {
    const adminRes = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Admin User",
        email: "couponadmin@example.com",
        phone: "9999999901",
        password: "password123",
      });
    adminToken = adminRes.body.data.accessToken;

    const adminUser = await Coupon.db.model("User").findOne({ email: "couponadmin@example.com" });
    if (adminUser) {
      adminUser.role = "admin";
      await adminUser.save();
    }

    const userRes = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Regular User",
        email: "couponuser@example.com",
        phone: "9999999902",
        password: "password123",
      });
    userToken = userRes.body.data.accessToken;
  });

  describe("Admin CRUD /api/v1/coupons", () => {
    it("should allow admin to create, get, update, and delete coupons", async () => {
      const createRes = await request(app)
        .post("/api/v1/coupons")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          code: "SAVE50",
          type: "flat",
          value: 50,
          minOrderAmount: 200,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.data.code).toBe("SAVE50");
      couponId = createRes.body.data._id;

      const listRes = await request(app)
        .get("/api/v1/coupons")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(listRes.status).toBe(200);
      expect(listRes.body.data.length).toBeGreaterThan(0);

      const updateRes = await request(app)
        .patch(`/api/v1/coupons/${couponId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ value: 60 });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.value).toBe(60);

      const deleteRes = await request(app)
        .delete(`/api/v1/coupons/${couponId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(deleteRes.status).toBe(200);
    });

    it("should prevent non-admin from creating coupons", async () => {
      const res = await request(app)
        .post("/api/v1/coupons")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          code: "HACKED",
          type: "flat",
          value: 100,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
      expect(res.status).toBe(403);
    });
  });

  describe("POST /api/v1/coupons/apply", () => {
    beforeEach(async () => {
      await Coupon.create([
        {
          code: "FLAT30",
          type: "flat",
          value: 30,
          minOrderAmount: 100,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          isActive: true,
        },
        {
          code: "PERCENT20",
          type: "percentage",
          value: 20,
          minOrderAmount: 150,
          maxDiscount: 50,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          isActive: true,
        },
        {
          code: "EXPIRED",
          type: "flat",
          value: 10,
          minOrderAmount: 50,
          expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          isActive: true,
        },
      ]);
    });

    it("should successfully apply a flat coupon and return correct discount", async () => {
      const res = await request(app)
        .post("/api/v1/coupons/apply")
        .send({ code: "FLAT30", subtotal: 120 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.discountAmount).toBe(30);
    });

    it("should successfully apply percentage coupon capped by max discount", async () => {
      const res = await request(app)
        .post("/api/v1/coupons/apply")
        .send({ code: "PERCENT20", subtotal: 300 });

      expect(res.status).toBe(200);
      expect(res.body.data.discountAmount).toBe(50);
    });

    it("should fail when subtotal is below min order amount", async () => {
      const res = await request(app)
        .post("/api/v1/coupons/apply")
        .send({ code: "FLAT30", subtotal: 80 });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Minimum order amount");
    });

    it("should fail when coupon has expired", async () => {
      const res = await request(app)
        .post("/api/v1/coupons/apply")
        .send({ code: "EXPIRED", subtotal: 100 });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("expired");
    });

    it("should fail when coupon does not exist", async () => {
      const res = await request(app)
        .post("/api/v1/coupons/apply")
        .send({ code: "NO_SUCH_COUPON", subtotal: 100 });

      expect(res.status).toBe(400);
    });
  });
});
