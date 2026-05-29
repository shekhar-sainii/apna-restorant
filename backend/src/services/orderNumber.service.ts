import mongoose, { Schema, Document } from "mongoose";

interface ICounter extends Omit<Document, "_id"> {
  _id: string;
  date: string;
  seq: number;
}

const counterSchema = new Schema<ICounter>({
  _id: { type: String, required: true },
  date: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model<ICounter>("Counter", counterSchema);

export const generateOrderNumber = async (): Promise<string> => {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  const counter = await Counter.findOneAndUpdate(
    { _id: "order", date: today },
    { $inc: { seq: 1 }, $setOnInsert: { date: today } },
    { upsert: true, new: true }
  );

  if (!counter) {
    throw new Error("Failed to generate order number counter");
  }

  const paddedSeq = String(counter.seq).padStart(4, "0");
  return `ORD-${today}-${paddedSeq}`;
};
