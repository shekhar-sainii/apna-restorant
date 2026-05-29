import Category, { ICategoryDocument } from "../../models/Category.model";

class CategoryRepository {
  async findAll(activeOnly = true): Promise<ICategoryDocument[]> {
    const query = activeOnly ? { isActive: true } : {};
    return Category.find(query).sort({ sortOrder: 1, name: 1 });
  }

  async findBySlug(slug: string): Promise<ICategoryDocument | null> {
    return Category.findOne({ slug });
  }

  async findById(id: string): Promise<ICategoryDocument | null> {
    return Category.findById(id);
  }

  async create(data: Partial<ICategoryDocument>): Promise<ICategoryDocument> {
    return Category.create(data);
  }

  async update(id: string, data: Partial<ICategoryDocument>): Promise<ICategoryDocument | null> {
    return Category.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async delete(id: string): Promise<ICategoryDocument | null> {
    return Category.findByIdAndDelete(id);
  }
}

export default new CategoryRepository();
