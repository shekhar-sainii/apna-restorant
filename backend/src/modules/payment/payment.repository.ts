import Payment, { IPayment } from "../../models/Payment.model";
import Order, { IOrderDocument } from "../../models/Order.model";

class PaymentRepository {
  async createPaymentRecord(data: Partial<IPayment>): Promise<IPayment> {
    return Payment.create(data);
  }

  async findByRazorpayOrderId(razorpayOrderId: string): Promise<IPayment | null> {
    return Payment.findOne({ razorpayOrderId }).populate({
      path: "order",
      populate: { path: "customer" }
    });
  }

  async updateByRazorpayOrderId(razorpayOrderId: string, data: Partial<IPayment>): Promise<IPayment | null> {
    return Payment.findOneAndUpdate({ razorpayOrderId }, data, { new: true });
  }

  async findByOrderId(orderId: string): Promise<IPayment | null> {
    return Payment.findOne({ order: orderId as any });
  }

  async updateOrderPaymentStatus(orderId: string, status: string, razorpayPaymentId: string | null): Promise<IOrderDocument | null> {
    return Order.findByIdAndUpdate(
      orderId,
      { paymentStatus: status, razorpayPaymentId },
      { new: true }
    );
  }
}

export default new PaymentRepository();
