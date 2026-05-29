import fetchApi from "./api";

export interface RestaurantSettings {
  _id?: string;
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

export const settingsService = {
  get: (): Promise<{ data: RestaurantSettings }> => fetchApi("/settings"),

  update: (data: Partial<RestaurantSettings>): Promise<{ data: RestaurantSettings }> =>
    fetchApi("/settings", { method: "PATCH", body: JSON.stringify(data) }),
};

export default settingsService;
