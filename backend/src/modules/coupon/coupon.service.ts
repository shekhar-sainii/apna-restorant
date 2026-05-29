import couponRepository from "./coupon.repository";
import ApiError from "../../utils/ApiError";
import { ICoupon } from "../../models/Coupon.model";

class CouponService {
  async validateAndApplyCoupon(code: string, subtotal: number): Promise<{ coupon: ICoupon; discountAmount: number }> {
    const coupon = await couponRepository.findByCode(code);
    if (!coupon) {
      throw ApiError.badRequest("Invalid coupon code");
    }

    if (!coupon.isActive) {
      throw ApiError.badRequest("Coupon is no longer active");
    }

    if (new Date() > new Date(coupon.expiresAt)) {
      throw ApiError.badRequest("Coupon has expired");
    }

    if (subtotal < coupon.minOrderAmount) {
      throw ApiError.badRequest(`Minimum order amount of ₹${coupon.minOrderAmount} required to use this coupon`);
    }

    if (coupon.usageLimit !== undefined && coupon.usedCount >= coupon.usageLimit) {
      throw ApiError.badRequest("Coupon usage limit reached");
    }

    let discountAmount = 0;
    if (coupon.type === "flat") {
      discountAmount = coupon.value;
    } else if (coupon.type === "percentage") {
      discountAmount = subtotal * (coupon.value / 100);
      if (coupon.maxDiscount !== undefined && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    }

    if (discountAmount > subtotal) {
      discountAmount = subtotal;
    }

    discountAmount = Math.round(discountAmount * 100) / 100;

    return { coupon, discountAmount };
  }

  async getAllCoupons() {
    return couponRepository.findAll();
  }

  async getActivePublicOffers() {
    return couponRepository.findActivePublic();
  }

  async createCoupon(data: any) {
    if (data.code) {
      data.code = data.code.toUpperCase();
    }
    return couponRepository.create(data);
  }

  async updateCoupon(id: string, data: any) {
    if (data.code) {
      data.code = data.code.toUpperCase();
    }
    const coupon = await couponRepository.update(id, data);
    if (!coupon) throw ApiError.notFound("Coupon not found");
    return coupon;
  }

  async deleteCoupon(id: string) {
    const coupon = await couponRepository.delete(id);
    if (!coupon) throw ApiError.notFound("Coupon not found");
    return coupon;
  }
}

export default new CouponService();
