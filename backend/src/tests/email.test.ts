import emailService from "../services/email.service";

describe("Email Service Templates and Rendering", () => {
  it("should successfully render and send welcome email", async () => {
    const success = await emailService.sendWelcomeEmail("test@example.com", "Test User");
    expect(success).toBe(true);
  });

  it("should successfully render and send password reset email", async () => {
    const success = await emailService.sendResetPasswordEmail("test@example.com", "Test User", "testtoken123");
    expect(success).toBe(true);
  });

  it("should successfully render and send order invoice email", async () => {
    const dummyOrder = {
      orderNumber: "ORD-123456",
      createdAt: new Date(),
      paymentMethod: "online",
      orderType: "delivery",
      subtotal: 100,
      gstPercent: 5,
      gstAmount: 5,
      deliveryCharge: 20,
      discount: 10,
      totalAmount: 115,
      items: [
        {
          name: "Paneer Butter Masala",
          quantity: 1,
          price: 100,
          subtotal: 100,
        },
      ],
    };

    const success = await emailService.sendInvoiceEmail("test@example.com", "Test User", dummyOrder);
    expect(success).toBe(true);
  });
});
