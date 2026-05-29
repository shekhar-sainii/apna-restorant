export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface IMenuItemSize {
  label: string;  // e.g. "Regular", "Medium", "Large", "Half", "Full"
  price: number;
}

export interface IMenuItem {
  _id: string;
  name: string;
  description?: string;
  price: number;          // base price (smallest size or only size)
  image?: string;
  category: ICategory | string;
  isVeg: boolean;
  isAvailable: boolean;
  preparationTime?: number;
  rating: {
    average: number;
    count: number;
  };
  tags?: string[];
  sortOrder: number;
  sizes: IMenuItemSize[]; // empty array = no size choice
}
