import orderRepository from "./order.repository";
import menuItemRepository from "../menu/menuItem.repository";
import couponRepository from "../coupon/coupon.repository";
import couponService from "../coupon/coupon.service";
import notificationService from "../notification/notification.service";
import socketService from "../../services/socket.service";
import { generateOrderNumber } from "../../services/orderNumber.service";
import { calculatePricing } from "../../shared/utils/pricing";
import { ORDER_STATUS, isValidTransition, OrderStatus } from "../../shared/constants/orderStatus";
import ApiError from "../../utils/ApiError";
import RestaurantSettings from "../../models/RestaurantSettings.model";
import { IOrderDocument } from "../../models/Order.model";
import { OrderType, PaymentMethod } from "../../shared/types/order.types";

class OrderService {
  async createOrder({
    customerId,
    guestSessionId,
    guestName,
    guestPhone,
    items: rawItems,
    orderType,
    tableNumber,
    deliveryAddress,
    paymentMethod,
    couponCode,
    specialInstructions,
  }: {
    customerId?: string;
    guestSessionId?: string;
    guestName?: string;
    guestPhone?: string;
    items: Array<{ menuItemId: string; quantity: number }>;
    orderType: OrderType;
    tableNumber?: number;
    deliveryAddress?: any;
    paymentMethod: PaymentMethod;
    couponCode?: string;
    specialInstructions?: string;
  }): Promise<IOrderDocument> {
    const menuItemIds = rawItems.map((i) => i.menuItemId);
    const menuItems = await menuItemRepository.findByIds(menuItemIds);

    if (menuItems.length !== rawItems.length) {
      throw ApiError.badRequest("One or more menu items not found");
    }

    const unavailable = menuItems.filter((m) => !m.isAvailable);
    if (unavailable.length > 0) {
      throw ApiError.badRequest(
        `Items unavailable: ${unavailable.map((i) => i.name).join(", ")}`
      );
    }

    const orderItems = rawItems.map((raw) => {
      const menuItem = menuItems.find((m) => m._id.toString() === raw.menuItemId);
      if (!menuItem) throw ApiError.badRequest("One or more menu items not found");
      return {
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: raw.quantity,
        subtotal: menuItem.price * raw.quantity,
      };
    });

    const settings = await RestaurantSettings.findOne();
    const gstPercent = settings?.gstPercent ?? 5;
    const deliveryChargeAmount = settings?.deliveryCharge ?? 0;
    const freeDeliveryAbove = settings?.freeDeliveryAbove ?? 0;

    let couponDiscount = 0;
    let validatedCoupon: any = null;
    if (couponCode) {
      const subtotal = orderItems.reduce((acc, item) => acc + item.subtotal, 0);
      const couponResult = await couponService.validateAndApplyCoupon(couponCode, subtotal);
      validatedCoupon = couponResult.coupon;
      couponDiscount = couponResult.discountAmount;
    }

    const pricing = calculatePricing({
      items: orderItems,
      orderType,
      gstPercent,
      deliveryCharge: deliveryChargeAmount,
      freeDeliveryAbove,
      couponDiscount,
    });

    if (orderType === "delivery" && !deliveryAddress) {
      throw ApiError.badRequest("Delivery address required");
    }
    if (orderType === "dine-in" && !tableNumber) {
      throw ApiError.badRequest("Table number required for dine-in");
    }
    if (orderType === "delivery" && !guestPhone && !customerId) {
      throw ApiError.badRequest("Phone number required for delivery");
    }

    const orderNumber = await generateOrderNumber();

    const orderData: any = {
      orderNumber,
      customer: customerId ? (customerId as any) : null,
      guestSessionId: customerId ? null : guestSessionId,
      guestName: guestName || null,
      guestPhone: guestPhone || null,
      items: orderItems,
      orderType,
      tableNumber: tableNumber || null,
      deliveryAddress: orderType === "delivery" ? deliveryAddress : null,
      ...pricing,
      gstPercent,
      couponCode: validatedCoupon?.code || null,
      paymentMethod,
      paymentStatus: "pending",
      status: ORDER_STATUS.PENDING,
      statusHistory: [{ status: ORDER_STATUS.PENDING, updatedAt: new Date(), note: "Order placed" }],
      isGuestOrder: !customerId,
      specialInstructions: specialInstructions || null,
    };

    const order = await orderRepository.create(orderData);

    if (validatedCoupon) {
      await couponRepository.incrementUsage(validatedCoupon._id);
    }

    if (customerId && paymentMethod === "cash") {
      const User = require("../../models/User.model").default;
      const user = await User.findById(customerId);
      if (user && user.email) {
        const emailService = require("../../services/email.service").default;
        const logger = require("../../utils/logger").default;
        emailService.sendInvoiceEmail(user.email, user.name, order).catch((err: any) => {
          logger.error(`Failed to send cash invoice email: ${err.message}`);
        });
      }
    }

    socketService.emitToAdmins("new-order", { order });
    socketService.emitToStaff("new-order", { order });

    await notificationService.createForAdmins({
      type: "new_order",
      title: "New Order Received! 🔔",
      message: `Order ${orderNumber} for ₹${pricing.totalAmount}`,
      orderId: order._id,
    });

    return order;
  }

  async updateStatus(orderId: string, newStatus: OrderStatus, updatedById: string, note?: string): Promise<IOrderDocument> {
    const order = await orderRepository.findById(orderId);
    if (!order) throw ApiError.notFound("Order not found");

    if (!isValidTransition(order.status, newStatus)) {
      throw ApiError.badRequest(
        `Cannot change status from "${order.status}" to "${newStatus}"`
      );
    }

    const updated = await orderRepository.updateStatus(orderId, newStatus, updatedById, note);
    if (!updated) throw ApiError.notFound("Order not found");

    socketService.emitToOrderRoom(orderId, "order-status-updated", {
      orderId,
      status: newStatus,
      updatedAt: new Date(),
      note,
    });
    socketService.emitToAdmins("order-status-updated", {
      orderId,
      status: newStatus,
      updatedAt: new Date(),
    });

    if (order.customer) {
      await notificationService.createForUser({
        userId: order.customer,
        type: `order_${newStatus}`,
        title: this._getStatusTitle(newStatus),
        message: `Your order ${order.orderNumber} is now: ${newStatus}`,
        orderId,
      });
    }

    return updated;
  }

  private _calculateCouponDiscount(coupon: any, items: Array<{ subtotal: number }>): number {
    const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
    if (subtotal < coupon.minOrderAmount) return 0;

    if (coupon.type === "flat") return Math.min(coupon.value, subtotal);

    const discount = (subtotal * coupon.value) / 100;
    return coupon.maxDiscount ? Math.min(discount, coupon.maxDiscount) : discount;
  }

  private _getStatusTitle(status: OrderStatus): string {
    const titles: Record<OrderStatus, string> = {
      pending: "Order Placed",
      accepted: "Order Accepted ✓",
      preparing: "Being Prepared 👨‍🍳",
      ready: "Ready! 🎉",
      out_for_delivery: "On the Way! 🛵",
      delivered: "Delivered! ✅",
      cancelled: "Order Cancelled",
    };
    return titles[status] || "Order Update";
  }
}

export default new OrderService();
