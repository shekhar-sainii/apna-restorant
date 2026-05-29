import crypto from "crypto";
import getRazorpay from "../../config/razorpay";
import paymentRepository from "./payment.repository";
import orderRepository from "../order/order.repository";
import notificationService from "../notification/notification.service";
import socketService from "../../services/socket.service";
import emailService from "../../services/email.service";
import ApiError from "../../utils/ApiError";
import Order from "../../models/Order.model";
import logger from "../../utils/logger";

class PaymentService {
  async createOrder(orderId: string) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw ApiError.notFound("Order not found");

    if (order.paymentMethod !== "online") {
      throw ApiError.badRequest("Order is not set for online payment");
    }

    if (order.paymentStatus === "paid") {
      throw ApiError.conflict("Order already paid");
    }

    const amountInPaise = Math.round(order.totalAmount * 100);

    const razorpayOrder = await getRazorpay().orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: order.orderNumber,
      notes: {
        orderId: orderId.toString(),
        orderNumber: order.orderNumber,
      },
    });

    await orderRepository.updatePaymentStatus(orderId, "pending", undefined);
    await Order.findByIdAndUpdate(orderId, { razorpayOrderId: razorpayOrder.id });

    await paymentRepository.createPaymentRecord({
      order: orderId as any,
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

  async verifyPayment({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  }: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) {
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      throw ApiError.badRequest("Payment verification failed");
    }

    const payment = await paymentRepository.findByRazorpayOrderId(razorpayOrderId);
    if (!payment) throw ApiError.notFound("Payment record not found");

    if (payment.status === "captured") {
      return payment.order;
    }

    await paymentRepository.updateByRazorpayOrderId(razorpayOrderId, {
      razorpayPaymentId,
      razorpaySignature,
      status: "captured",
      verifiedAt: new Date(),
    });

    const populatedOrder = payment.order as any;

    await paymentRepository.updateOrderPaymentStatus(populatedOrder._id, "paid", razorpayPaymentId);

    socketService.emitToOrderRoom(populatedOrder._id.toString(), "payment-success", {
      orderId: populatedOrder._id,
      paymentId: razorpayPaymentId,
    });
    socketService.emitToAdmins("payment-success", {
      orderId: populatedOrder._id,
      paymentId: razorpayPaymentId,
    });

    if (populatedOrder.customer) {
      await notificationService.createForUser({
        userId: populatedOrder.customer._id || populatedOrder.customer,
        type: "payment_success",
        title: "Payment Successful ✓",
        message: `Payment of ₹${populatedOrder.totalAmount} received`,
        orderId: populatedOrder._id,
      });

      if (populatedOrder.customer.email) {
        emailService.sendInvoiceEmail(
          populatedOrder.customer.email,
          populatedOrder.customer.name,
          populatedOrder
        ).catch((err) => {
          logger.error(`Failed to send invoice email: ${err.message}`);
        });
      }
    }

    return populatedOrder;
  }

  async handleWebhook(rawBody: Buffer | string, signature: string | string[] | undefined) {
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET || "")
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
      if (!payment) return;

      if (payment.status === "captured") return;

      await paymentRepository.updateByRazorpayOrderId(razorpayOrderId, {
        razorpayPaymentId,
        status: "captured",
        method: payload.payload.payment.entity.method,
        webhookPayload: payload,
        verifiedAt: new Date(),
      });

      const populatedOrder = payment.order as any;

      await paymentRepository.updateOrderPaymentStatus(populatedOrder._id, "paid", razorpayPaymentId);

      const order = await Order.findById(populatedOrder._id);
      if (order && order.status === "pending") {
        await Order.findByIdAndUpdate(populatedOrder._id, {
          status: "accepted",
          $push: {
            statusHistory: { status: "accepted", updatedAt: new Date(), note: "Auto-accepted after payment" },
          },
        });
      }

      socketService.emitToOrderRoom(populatedOrder._id.toString(), "payment-success", {
        orderId: populatedOrder._id,
      });

      if (populatedOrder.customer && populatedOrder.customer.email) {
        emailService.sendInvoiceEmail(
          populatedOrder.customer.email,
          populatedOrder.customer.name,
          populatedOrder
        ).catch((err) => {
          logger.error(`Failed to send invoice email from webhook: ${err.message}`);
        });
      }
    }

    if (event === "payment.failed") {
      const razorpayOrderId = payload.payload.payment.entity.order_id;
      const payment = await paymentRepository.findByRazorpayOrderId(razorpayOrderId);
      if (payment) {
        await paymentRepository.updateByRazorpayOrderId(razorpayOrderId, { status: "failed" });
        const populatedOrder = payment.order as any;
        await paymentRepository.updateOrderPaymentStatus(populatedOrder._id, "failed", null);

        socketService.emitToOrderRoom(populatedOrder._id.toString(), "payment-failed", {
          orderId: populatedOrder._id,
          reason: "Payment failed",
        });
      }
    }
  }
}

export default new PaymentService();
