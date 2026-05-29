import fetchApi from "./api";

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: "admin" | "staff" | "user";
  isActive: boolean;
  createdAt: string;
}

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  profileImage?: string | null;
  isActive: boolean;
}

export interface UserAddress {
  _id: string;
  label: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  pincode: string;
  isDefault: boolean;
}

export interface AddressPayload {
  label: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  pincode: string;
  isDefault?: boolean;
}

export const userService = {
  // Admin
  getAll: (): Promise<{ data: AdminUser[] }> => fetchApi("/users"),

  toggleStatus: (id: string, isActive: boolean): Promise<{ data: AdminUser }> =>
    fetchApi(`/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    }),

  updateRole: (id: string, role: AdminUser["role"]): Promise<{ data: AdminUser }> =>
    fetchApi(`/users/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),

  // Customer profile
  getProfile: (): Promise<{ data: UserProfile }> => fetchApi("/users/profile"),

  updateProfile: (data: { name?: string; phone?: string }): Promise<{ data: UserProfile }> =>
    fetchApi("/users/profile", { method: "PATCH", body: JSON.stringify(data) }),

  getAddresses: (): Promise<{ data: UserAddress[] }> => fetchApi("/users/addresses"),

  addAddress: (data: AddressPayload): Promise<{ data: UserAddress }> =>
    fetchApi("/users/addresses", { method: "POST", body: JSON.stringify(data) }),

  updateAddress: (id: string, data: Partial<AddressPayload>): Promise<{ data: UserAddress }> =>
    fetchApi(`/users/addresses/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  deleteAddress: (id: string): Promise<{ data: UserAddress }> =>
    fetchApi(`/users/addresses/${id}`, { method: "DELETE" }),
};

export default userService;
