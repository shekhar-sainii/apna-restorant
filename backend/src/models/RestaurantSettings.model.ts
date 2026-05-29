import mongoose, { Schema, Document } from "mongoose";

export interface IRestaurantSettings extends Document {
  restaurantName: string;
  address: string;
  phone: string;
  openTime: string;
  closeTime: string;
  gstPercent: number;
  deliveryCharge: number;
  freeDeliveryAbove: number;
  autoAcceptOrders: boolean;
  emailNotifications: boolean;
}

const RestaurantSettingsSchema = new Schema<IRestaurantSettings>(
  {
    restaurantName:      { type: String, default: "Apna Restaurant" },
    address:             { type: String, default: "" },
    phone:               { type: String, default: "" },
    openTime:            { type: String, default: "10:00" },
    closeTime:           { type: String, default: "23:00" },
    gstPercent:          { type: Number, default: 5 },
    deliveryCharge:      { type: Number, default: 0 },
    freeDeliveryAbove:   { type: Number, default: 0 },
    autoAcceptOrders:    { type: Boolean, default: true },
    emailNotifications:  { type: Boolean, default: true },
  },
  { timestamps: true }
);

const RestaurantSettings = mongoose.model<IRestaurantSettings>("RestaurantSettings", RestaurantSettingsSchema);
export default RestaurantSettings;
