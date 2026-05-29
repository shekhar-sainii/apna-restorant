import request from "supertest";
import app from "../app";
import Notification from "../models/Notification.model";

describe("Notification API Endpoints", () => {
  let userToken: string;
  let userId: string;
  let adminToken: string;
  let notificationId: string;

  beforeEach(async () => {
    const userRes = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Notification User",
        email: "notifuser@example.com",
        phone: "9999999801",
        password: "password123",
      });
    userToken = userRes.body.data.accessToken;
    userId = userRes.body.data.user._id;

    const adminRes = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Notification Admin",
        email: "notifadmin@example.com",
        phone: "9999999802",
        password: "password123",
      });
    adminToken = adminRes.body.data.accessToken;

    const adminUser = await Notification.db.model("User").findOne({ email: "notifadmin@example.com" });
    if (adminUser) {
      adminUser.role = "admin";
      await adminUser.save();
    }

    const notif = await Notification.create({
      recipient: userId as any,
      type: "payment_success",
      title: "Payment Received",
      message: "Your payment of ₹100 was successful",
    });
    notificationId = notif._id.toString();

    await Notification.create({
      recipientRole: "admin",
      type: "new_order",
      title: "New Order",
      message: "Order ORD-123 was placed",
    });
  });

  describe("GET /api/v1/notifications", () => {
    it("should retrieve user notifications", async () => {
      const res = await request(app)
        .get("/api/v1/notifications")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe("Payment Received");
    });

    it("should retrieve admin notifications for admin user", async () => {
      const res = await request(app)
        .get("/api/v1/notifications")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe("New Order");
    });
  });

  describe("PATCH /api/v1/notifications/:id/read", () => {
    it("should mark a notification as read", async () => {
      const res = await request(app)
        .patch(`/api/v1/notifications/${notificationId}/read`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isRead).toBe(true);

      const dbNotif = await Notification.findById(notificationId);
      expect(dbNotif?.isRead).toBe(true);
    });
  });

  describe("PATCH /api/v1/notifications/read-all", () => {
    it("should mark all user notifications as read", async () => {
      const res = await request(app)
        .patch("/api/v1/notifications/read-all")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);

      const unreadCount = await Notification.countDocuments({ recipient: userId as any, isRead: false });
      expect(unreadCount).toBe(0);
    });
  });
});
