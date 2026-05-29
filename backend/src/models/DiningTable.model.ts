import mongoose, { Schema, Document } from "mongoose";

export type TableStatus = "available" | "occupied" | "reserved";

export interface IDiningTable extends Document {
  tableNumber: number;
  label: string;
  capacity: number;
  status: TableStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const diningTableSchema = new Schema<IDiningTable>(
  {
    tableNumber: { type: Number, required: true, unique: true, min: 1 },
    label: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true, min: 1, default: 4 },
    status: {
      type: String,
      enum: ["available", "occupied", "reserved"],
      default: "available",
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const DiningTable = mongoose.model<IDiningTable>("DiningTable", diningTableSchema);
export default DiningTable;
