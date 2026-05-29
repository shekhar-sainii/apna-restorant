import Coupon, { ICoupon } from "../../models/Coupon.model";

class CouponRepository {
  async findByCode(code: string): Promise<ICoupon | null> {
    return Coupon.findOne({ code: code.toUpperCase() });
  }

  async incrementUsage(id: string): Promise<void> {
    await Coupon.findByIdAndUpdate(id, { $inc: { usedCount: 1 } });
  }

  async findAll(): Promise<ICoupon[]> {
    return Coupon.find().sort({ createdAt: -1 });
  }

  async findActivePublic(): Promise<ICoupon[]> {
    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      expiresAt: { $gt: now },
    })
      .select("code type value minOrderAmount maxDiscount expiresAt usageLimit usedCount")
      .sort({ minOrderAmount: 1 })
      .limit(20);

    return coupons
      .filter((c) => c.usageLimit == null || c.usedCount < c.usageLimit)
      .slice(0, 12);
  }

  async create(data: Partial<ICoupon>): Promise<ICoupon> {
    return Coupon.create(data);
  }

  async findById(id: string): Promise<ICoupon | null> {
    return Coupon.findById(id);
  }

  async update(id: string, data: Partial<ICoupon>): Promise<ICoupon | null> {
    return Coupon.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string): Promise<ICoupon | null> {
    return Coupon.findByIdAndDelete(id);
  }
}

export default new CouponRepository();
