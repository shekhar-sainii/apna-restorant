import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  recipient?: mongoose.Types.ObjectId;
  recipientRole?: "admin" | "staff" | "user";
  type: "new_order" | "order_accepted" | "order_preparing" | "order_ready" | "order_out_for_delivery" | "order_delivered" | "order_cancelled" | "payment_success" | "payment_failed";
  title: string;
  message: string;
  order?: mongoose.Types.ObjectId;
  isRead: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", default: null },
    recipientRole: { type: String, enum: ["admin", "staff", "user"], default: null },
    type: {
      type: String,
      enum: [
        "new_order",
        "order_accepted",
        "order_preparing",
        "order_ready",
        "order_out_for_delivery",
        "order_delivered",
        "order_cancelled",
        "payment_success",
        "payment_failed",
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    order: { type: Schema.Types.ObjectId, ref: "Order", default: null },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipientRole: 1, isRead: 1 });

const Notification = mongoose.model<INotification>("Notification", notificationSchema);
export default Notification;
