import menuItemRepository, { MenuItemFilters } from "./menuItem.repository";
import cloudinaryService from "../../services/cloudinary.service";
import ApiError from "../../utils/ApiError";
import { IMenuItemDocument } from "../../models/MenuItem.model";

class MenuItemService {
  async getAll(filters: MenuItemFilters): Promise<{ items: IMenuItemDocument[]; total: number }> {
    return menuItemRepository.findAll(filters);
  }

  async getById(id: string): Promise<IMenuItemDocument> {
    const item = await menuItemRepository.findById(id);
    if (!item) throw ApiError.notFound("Menu item not found");
    return item;
  }

  async create({
    name,
    description,
    price,
    category,
    isVeg,
    preparationTime,
    tags,
    sortOrder,
    file,
  }: {
    name: string;
    description?: string;
    price: number | string;
    category: string;
    isVeg: boolean | string;
    preparationTime?: number | string;
    tags?: string | string[];
    sortOrder?: number | string;
    file?: Express.Multer.File;
  }): Promise<IMenuItemDocument> {
    if (!name || !price || !category || isVeg === undefined) {
      throw ApiError.badRequest("Name, price, category and isVeg are required");
    }

    let parsedTags: string[] = [];
    if (tags) {
      if (typeof tags === "string") {
        try {
          parsedTags = JSON.parse(tags);
        } catch {
          parsedTags = tags.split(",").map(t => t.trim());
        }
      } else {
        parsedTags = tags;
      }
    }

    const itemData: any = {
      name,
      description: description || "",
      price: Number(price),
      category: category as any,
      isVeg: isVeg === "true" || isVeg === true,
      preparationTime: Number(preparationTime) || 15,
      tags: parsedTags,
      sortOrder: Number(sortOrder) || 0,
      isAvailable: true,
    };

    if (file) {
      itemData.image = await cloudinaryService.uploadImage(file.path, "restaurant/menu");
    }

    return menuItemRepository.create(itemData);
  }

  async update(
    id: string,
    updates: Partial<IMenuItemDocument> & { tags?: string | string[] },
    file?: Express.Multer.File
  ): Promise<IMenuItemDocument> {
    const item = await menuItemRepository.findById(id);
    if (!item) throw ApiError.notFound("Menu item not found");

    if (file) {
      if (item.image) await cloudinaryService.deleteImage(item.image);
      updates.image = await cloudinaryService.uploadImage(file.path, "restaurant/menu");
    }

    if (updates.price !== undefined) {
      updates.price = Number(updates.price);
    }
    if (updates.isVeg !== undefined) {
      const isVegVal = updates.isVeg as any;
      updates.isVeg = isVegVal === "true" || isVegVal === true;
    }
    if (updates.preparationTime !== undefined) {
      updates.preparationTime = Number(updates.preparationTime) || 15;
    }
    if (updates.sortOrder !== undefined) {
      updates.sortOrder = Number(updates.sortOrder) || 0;
    }

    if (updates.tags !== undefined) {
      let parsedTags: string[] = [];
      if (typeof updates.tags === "string") {
        try {
          parsedTags = JSON.parse(updates.tags);
        } catch {
          parsedTags = updates.tags.split(",").map(t => t.trim());
        }
      } else {
        parsedTags = updates.tags;
      }
      updates.tags = parsedTags;
    }

    const updated = await menuItemRepository.update(id, updates as any);
    if (!updated) throw ApiError.notFound("Menu item not found");
    return updated;
  }

  async toggleAvailability(id: string): Promise<IMenuItemDocument> {
    const item = await menuItemRepository.findById(id);
    if (!item) throw ApiError.notFound("Menu item not found");
    const updated = await menuItemRepository.update(id, { isAvailable: !item.isAvailable });
    if (!updated) throw ApiError.notFound("Menu item not found");
    return updated;
  }

  async delete(id: string): Promise<IMenuItemDocument> {
    const item = await menuItemRepository.findById(id);
    if (!item) throw ApiError.notFound("Menu item not found");
    if (item.image) await cloudinaryService.deleteImage(item.image);
    const deleted = await menuItemRepository.delete(id);
    if (!deleted) throw ApiError.notFound("Menu item not found");
    return deleted;
  }
}

export default new MenuItemService();
