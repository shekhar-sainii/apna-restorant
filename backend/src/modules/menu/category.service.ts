import categoryRepository from "./category.repository";
import cloudinaryService from "../../services/cloudinary.service";
import ApiError from "../../utils/ApiError";
import { ICategoryDocument } from "../../models/Category.model";

const slugify = (name: string): string =>
  name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

class CategoryService {
  async getAll(includeInactive = false): Promise<ICategoryDocument[]> {
    return categoryRepository.findAll(!includeInactive);
  }

  async create({ name, sortOrder, file }: { name: string; sortOrder?: number | string; file?: Express.Multer.File }): Promise<ICategoryDocument> {
    if (!name) {
      throw ApiError.badRequest("Category name is required");
    }
    const slug = slugify(name);
    const existing = await categoryRepository.findBySlug(slug);
    if (existing) throw ApiError.conflict("Category already exists");

    const categoryData: any = {
      name,
      slug,
      sortOrder: Number(sortOrder) || 0,
      isActive: true,
    };

    if (file) {
      categoryData.image = await cloudinaryService.uploadImage(file.path, "restaurant/categories");
    }

    return categoryRepository.create(categoryData);
  }

  async update(id: string, { name, isActive, sortOrder, file }: { name?: string; isActive?: boolean | string; sortOrder?: number | string; file?: Express.Multer.File }): Promise<ICategoryDocument> {
    const category = await categoryRepository.findById(id);
    if (!category) throw ApiError.notFound("Category not found");

    const updates: Partial<ICategoryDocument> = {};
    if (name) {
      updates.name = name;
      updates.slug = slugify(name);
    }
    if (isActive !== undefined) {
      updates.isActive = isActive === "true" || isActive === true;
    }
    if (sortOrder !== undefined) {
      updates.sortOrder = Number(sortOrder) || 0;
    }
    if (file) {
      if (category.image) await cloudinaryService.deleteImage(category.image);
      updates.image = await cloudinaryService.uploadImage(file.path, "restaurant/categories");
    }

    const updated = await categoryRepository.update(id, updates);
    if (!updated) throw ApiError.notFound("Category not found");
    return updated;
  }

  async delete(id: string): Promise<ICategoryDocument> {
    const category = await categoryRepository.findById(id);
    if (!category) throw ApiError.notFound("Category not found");
    if (category.image) await cloudinaryService.deleteImage(category.image);
    const deleted = await categoryRepository.delete(id);
    if (!deleted) throw ApiError.notFound("Category not found");
    return deleted;
  }
}

export default new CategoryService();
