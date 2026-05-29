import mongoose, { Schema, Document } from "mongoose";
import { ICategory } from "../shared/types/menu.types";

export interface ICategoryDocument extends Document, Omit<ICategory, "_id" | "createdAt" | "updatedAt"> {}

const categorySchema = new Schema<ICategoryDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    image: { type: String, default: null },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

categorySchema.index({ isActive: 1, sortOrder: 1 });

const Category = mongoose.model<ICategoryDocument>("Category", categorySchema);
export default Category;
