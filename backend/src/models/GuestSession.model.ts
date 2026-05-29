import mongoose, { Schema, Document } from "mongoose";

export interface IGuestSession {
  guestSessionId: string;
  tableNumber?: number | null;
  ipAddress?: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface IGuestSessionDocument extends Document, IGuestSession {}

const guestSessionSchema = new Schema<IGuestSessionDocument>({
  guestSessionId: { type: String, required: true, unique: true },
  tableNumber: { type: Number, default: null },
  ipAddress: { type: String },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
  createdAt: { type: Date, default: Date.now },
});

guestSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const GuestSession = mongoose.model<IGuestSessionDocument>("GuestSession", guestSessionSchema);
export default GuestSession;
