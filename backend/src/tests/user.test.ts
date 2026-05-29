import request from "supertest";
import app from "../app";
import Address from "../models/Address.model";
import User from "../models/User.model";

describe("User & Address API Endpoints", () => {
  let adminToken: string;
  let userToken: string;
  let userId: string;
  let addressId: string;

  beforeEach(async () => {
    const adminRes = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "User Admin",
        email: "useradmin@example.com",
        phone: "9999999701",
        password: "password123",
      });
    adminToken = adminRes.body.data.accessToken;

    const adminUser = await User.findOne({ email: "useradmin@example.com" });
    if (adminUser) {
      adminUser.role = "admin";
      await adminUser.save();
    }

    const userRes = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "User Normal",
        email: "usernormal@example.com",
        phone: "9999999702",
        password: "password123",
      });
    userToken = userRes.body.data.accessToken;
    userId = userRes.body.data.user._id;
  });

  describe("Profile Endpoint", () => {
    it("should retrieve logged in user profile", async () => {
      const res = await request(app)
        .get("/api/v1/users/profile")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("User Normal");
      expect(res.body.data.email).toBe("usernormal@example.com");
    });

    it("should update user profile successfully", async () => {
      const res = await request(app)
        .patch("/api/v1/users/profile")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ name: "Updated Normal Name" });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("Updated Normal Name");
    });
  });

  describe("Address Endpoints", () => {
    it("should add first address as default automatically", async () => {
      const res = await request(app)
        .post("/api/v1/users/addresses")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          label: "Home",
          line1: "123 Main Street",
          city: "New Delhi",
          pincode: "110001",
        });

      expect(res.status).toBe(201);
      expect(res.body.data.label).toBe("Home");
      expect(res.body.data.isDefault).toBe(true);
      addressId = res.body.data._id;
    });

    it("should add second address and handle default shifting", async () => {
      const firstRes = await request(app)
        .post("/api/v1/users/addresses")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          label: "Home",
          line1: "123 Main Street",
          city: "New Delhi",
          pincode: "110001",
        });
      const firstId = firstRes.body.data._id;

      const secondRes = await request(app)
        .post("/api/v1/users/addresses")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          label: "Work",
          line1: "456 Tech Park",
          city: "Gurugram",
          pincode: "122001",
          isDefault: true,
        });

      expect(secondRes.status).toBe(201);
      expect(secondRes.body.data.isDefault).toBe(true);

      const dbFirst = await Address.findById(firstId);
      expect(dbFirst?.isDefault).toBe(false);
    });

    it("should list addresses, update address and delete address", async () => {
      const firstRes = await request(app)
        .post("/api/v1/users/addresses")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          label: "Home",
          line1: "123 Main Street",
          city: "New Delhi",
          pincode: "110001",
        });
      const firstId = firstRes.body.data._id;

      const listRes = await request(app)
        .get("/api/v1/users/addresses")
        .set("Authorization", `Bearer ${userToken}`);
      expect(listRes.status).toBe(200);
      expect(listRes.body.data.length).toBe(1);

      const updateRes = await request(app)
        .patch(`/api/v1/users/addresses/${firstId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ landmark: "Near Metro" });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.landmark).toBe("Near Metro");

      const deleteRes = await request(app)
        .delete(`/api/v1/users/addresses/${firstId}`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(deleteRes.status).toBe(200);

      const dbAddr = await Address.findById(firstId);
      expect(dbAddr).toBeNull();
    });
  });

  describe("Admin Actions", () => {
    it("should allow admin to list all users", async () => {
      const res = await request(app)
        .get("/api/v1/users")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it("should allow admin to update user status", async () => {
      const res = await request(app)
        .patch(`/api/v1/users/${userId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ isActive: false });

      expect(res.status).toBe(200);
      expect(res.body.data.isActive).toBe(false);

      const dbUser = await User.findById(userId);
      expect(dbUser?.isActive).toBe(false);
    });

    it("should prevent non-admin from listing users", async () => {
      const res = await request(app)
        .get("/api/v1/users")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });
});
