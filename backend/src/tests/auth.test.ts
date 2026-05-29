import request from "supertest";
import app from "../app";

describe("Auth API Endpoints", () => {
  const testUser = {
    name: "John Doe",
    email: "john@example.com",
    phone: "9876543210",
    password: "password123",
  };

  describe("POST /api/v1/auth/register", () => {
    it("should successfully register a new user", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.accessToken).toBeDefined();

      const cookies = res.headers["set-cookie"] as any;
      expect(cookies).toBeDefined();
      const hasRefreshToken = Array.isArray(cookies) && cookies.some((c: string) => c.includes("refreshToken"));
      expect(hasRefreshToken).toBe(true);
    });

    it("should fail when email is already registered", async () => {
      await request(app).post("/api/v1/auth/register").send(testUser);

      const res = await request(app).post("/api/v1/auth/register").send(testUser);
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /api/v1/auth/login", () => {
    beforeEach(async () => {
      await request(app).post("/api/v1/auth/register").send(testUser);
    });

    it("should login registered user successfully", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it("should reject invalid credentials", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: testUser.email,
          password: "wrongpassword",
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/v1/auth/me", () => {
    let accessToken: string;

    beforeEach(async () => {
      const res = await request(app).post("/api/v1/auth/register").send(testUser);
      accessToken = res.body.data.accessToken;
    });

    it("should return current user details when authorized", async () => {
      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testUser.email);
    });

    it("should deny access when unauthorized", async () => {
      const res = await request(app).get("/api/v1/auth/me");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/v1/auth/guest-session", () => {
    it("should create a new guest session successfully", async () => {
      const res = await request(app).post("/api/v1/auth/guest-session");
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.guestSessionId).toBeDefined();
    });
  });
});
