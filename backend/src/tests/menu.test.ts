import request from "supertest";
import app from "../app";
import User from "../models/User.model";
import Category from "../models/Category.model";
import MenuItem from "../models/MenuItem.model";

describe("Menu API Endpoints", () => {
  let adminToken: string;
  let userToken: string;

  beforeEach(async () => {
    const userRes = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Normal User",
        email: "user@example.com",
        phone: "9876543211",
        password: "password123",
      });
    userToken = userRes.body.data.accessToken;

    const adminRes = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Admin User",
        email: "admin@example.com",
        phone: "9876543212",
        password: "password123",
      });
    adminToken = adminRes.body.data.accessToken;

    await User.updateOne({ email: "admin@example.com" }, { role: "admin" });
  });

  describe("Categories CRUD", () => {
    it("should allow admin to create a category", async () => {
      const res = await request(app)
        .post("/api/v1/menu/categories")
        .set("Authorization", `Bearer ${adminToken}`)
        .field("name", "Burgers")
        .field("sortOrder", "1");

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Burgers");
      expect(res.body.data.slug).toBe("burgers");
    });

    it("should prevent non-admin from creating a category", async () => {
      const res = await request(app)
        .post("/api/v1/menu/categories")
        .set("Authorization", `Bearer ${userToken}`)
        .field("name", "Burgers");

      expect(res.status).toBe(403);
    });

    it("should list active categories publicly", async () => {
      await Category.create({
        name: "Burgers",
        slug: "burgers",
        sortOrder: 1,
        isActive: true,
      });

      const res = await request(app).get("/api/v1/menu/categories");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe("Burgers");
    });
  });

  describe("Menu Items CRUD", () => {
    let categoryId: string;

    beforeEach(async () => {
      const cat = await Category.create({
        name: "Burgers",
        slug: "burgers",
        sortOrder: 1,
        isActive: true,
      });
      categoryId = (cat._id as any).toString();
    });

    it("should allow admin to create a menu item", async () => {
      const res = await request(app)
        .post("/api/v1/menu/items")
        .set("Authorization", `Bearer ${adminToken}`)
        .field("name", "Cheese Burger")
        .field("price", "199")
        .field("category", categoryId)
        .field("isVeg", "true")
        .field("preparationTime", "10")
        .field("tags", JSON.stringify(["classic", "cheese"]));

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Cheese Burger");
      expect(res.body.data.price).toBe(199);
      expect(res.body.data.category.toString()).toBe(categoryId);
    });

    it("should retrieve a menu item by ID", async () => {
      const item = await MenuItem.create({
        name: "Veg Burger",
        price: 149,
        category: categoryId,
        isVeg: true,
        isAvailable: true,
      });

      const res = await request(app).get(`/api/v1/menu/items/${item._id}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Veg Burger");
    });
  });
});
