import mongoose, { Schema, Document } from "mongoose";
import { IMenuItem } from "../shared/types/menu.types";

export interface IMenuItemDocument extends Document, Omit<IMenuItem, "_id" | "category" | "createdAt" | "updatedAt"> {
  category: mongoose.Types.ObjectId;
}

const sizeSchema = new Schema(
  {
    label: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const menuItemSchema = new Schema<IMenuItemDocument>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: null },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    isVeg: { type: Boolean, required: true },
    isAvailable: { type: Boolean, default: true },
    preparationTime: { type: Number, default: 15 },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    tags: [{ type: String }],
    sortOrder: { type: Number, default: 0 },
    sizes: { type: [sizeSchema], default: [] },
  },
  { timestamps: true }
);

menuItemSchema.index({ category: 1, isAvailable: 1 });
menuItemSchema.index({ isAvailable: 1, sortOrder: 1 });
menuItemSchema.index({ name: "text", description: "text" });

const MenuItem = mongoose.model<IMenuItemDocument>("MenuItem", menuItemSchema);
export default MenuItem;
