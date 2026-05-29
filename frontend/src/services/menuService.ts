import fetchApi from "./api";

export interface Category {
  _id: string;
  name: string;
  slug: string;
  image: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface MenuItemSize {
  label: string;
  price: number;
}

export interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string | null;
  category: string | Category;
  isVeg: boolean;
  isAvailable: boolean;
  preparationTime: number;
  rating: { average: number; count: number };
  tags: string[];
  sizes: MenuItemSize[]; // empty = no size choice, use base price
}

export const menuService = {
  getCategories: (): Promise<{ data: Category[] }> =>
    fetchApi("/menu/categories"),

  getItems: (params?: { category?: string; search?: string }): Promise<{ data: MenuItem[] }> => {
    const qs = new URLSearchParams();
    if (params?.category) qs.set("category", params.category);
    if (params?.search) qs.set("search", params.search);
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return fetchApi(`/menu/items${query}`);
  },
};

export default menuService;
