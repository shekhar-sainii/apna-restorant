import MenuItem, { IMenuItemDocument } from "../../models/MenuItem.model";

export interface MenuItemFilters {
  category?: string;
  isVeg?: boolean;
  isAvailable?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

class MenuItemRepository {
  async findAll({ category, isVeg, isAvailable, search, page = 1, limit = 20 }: MenuItemFilters): Promise<{ items: IMenuItemDocument[]; total: number }> {
    const query: any = {};
    if (category) query.category = category;
    if (isVeg !== undefined) query.isVeg = isVeg;
    if (isAvailable !== undefined) query.isAvailable = isAvailable;
    if (search) query.$text = { $search: search };

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      MenuItem.find(query)
        .populate("category", "name slug")
        .sort({ sortOrder: 1, name: 1 })
        .skip(skip)
        .limit(limit),
      MenuItem.countDocuments(query),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<IMenuItemDocument | null> {
    return MenuItem.findById(id).populate("category", "name slug");
  }

  async create(data: Partial<IMenuItemDocument>): Promise<IMenuItemDocument> {
    return MenuItem.create(data);
  }

  async update(id: string, data: Partial<IMenuItemDocument>): Promise<IMenuItemDocument | null> {
    return MenuItem.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async delete(id: string): Promise<IMenuItemDocument | null> {
    return MenuItem.findByIdAndDelete(id);
  }

  async findByIds(ids: string[]): Promise<IMenuItemDocument[]> {
    return MenuItem.find({ _id: { $in: ids } });
  }
}

export default new MenuItemRepository();
