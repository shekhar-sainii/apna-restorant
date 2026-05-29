import mongoose, { Schema, Document } from "mongoose";
import { IOrder, IOrderItem } from "../shared/types/order.types";

export interface IOrderDocument extends Document, Omit<IOrder, "_id" | "customer" | "assignedStaff" | "createdAt" | "updatedAt"> {
  customer?: mongoose.Types.ObjectId;
  assignedStaff?: mongoose.Types.ObjectId;
}

const orderItemSchema = new Schema({
  menuItem: { type: Schema.Types.ObjectId, ref: "MenuItem", required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  subtotal: { type: Number, required: true },
}, { _id: false });

const statusHistorySchema = new Schema({
  status: { type: String, required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  updatedAt: { type: Date, default: Date.now },
  note: { type: String, default: "" },
}, { _id: false });

const orderSchema = new Schema<IOrderDocument>(
  {
    orderNumber: { type: String, required: true, unique: true },
    customer: { type: Schema.Types.ObjectId, ref: "User", default: null },
    guestSessionId: { type: String, default: null },
    guestName: { type: String, default: null },
    guestPhone: { type: String, default: null },
    items: [orderItemSchema],
    orderType: {
      type: String,
      enum: ["dine-in", "delivery", "takeaway"],
      required: true,
    },
    tableNumber: { type: Number, default: null },
    deliveryAddress: {
      line1: { type: String, default: null },
      line2: { type: String, default: null },
      landmark: { type: String, default: null },
      city: { type: String, default: null },
      pincode: { type: String, default: null },
      coordinates: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
      },
    },
    subtotal: { type: Number, required: true },
    gstPercent: { type: Number, default: 5 },
    gstAmount: { type: Number, default: 0 },
    deliveryCharge: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    couponCode: { type: String, default: null },
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["cash", "online"], required: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    status: {
      type: String,
      enum: ["pending", "accepted", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"],
      default: "pending",
    },
    statusHistory: [statusHistorySchema],
    assignedStaff: { type: Schema.Types.ObjectId, ref: "User", default: null },
    isGuestOrder: { type: Boolean, default: false },
    specialInstructions: { type: String, default: null },
    estimatedDeliveryTime: { type: Date, default: null },
  },
  { timestamps: true }
);

orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ guestSessionId: 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ assignedStaff: 1, status: 1 });

const Order = mongoose.model<IOrderDocument>("Order", orderSchema);
export default Order;
