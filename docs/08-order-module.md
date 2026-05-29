# 08 — Order Module

> Cart Logic, Order Creation, Status Machine, Staff Operations

---

## 1. Order Model — `src/models/Order.model.js`

```js
const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" },
  name: String,         // snapshot
  price: Number,        // snapshot
  quantity: { type: Number, min: 1 },
  subtotal: Number,
}, { _id: false });

const statusHistorySchema = new mongoose.Schema({
  status: String,
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedAt: { type: Date, default: Date.now },
  note: String,
}, { _id: false });

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    guestSessionId: { type: String, default: null },
    guestName: String,
    guestPhone: String,

    items: [orderItemSchema],

    orderType: {
      type: String,
      enum: ["dine-in", "delivery", "takeaway"],
      required: true,
    },
    tableNumber: { type: Number, default: null },
    deliveryAddress: {
      line1: String,
      line2: String,
      landmark: String,
      city: String,
      pincode: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },

    subtotal: { type: Number, required: true },
    gstPercent: { type: Number, default: 5 },
    gstAmount: { type: Number, default: 0 },
    deliveryCharge: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    couponCode: String,
    totalAmount: { type: Number, required: true },

    paymentMethod: { type: String, enum: ["cash", "online"] },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,

    status: {
      type: String,
      enum: ["pending", "accepted", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"],
      default: "pending",
    },
    statusHistory: [statusHistorySchema],

    assignedStaff: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    isGuestOrder: { type: Boolean, default: false },
    specialInstructions: String,
    estimatedDeliveryTime: Date,
  },
  { timestamps: true }
);

orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ guestSessionId: 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ assignedStaff: 1, status: 1 });

module.exports = mongoose.model("Order", orderSchema);
```

---

## 2. Order Number Service — `src/services/orderNumber.service.js`

```js
// Uses a counter document for atomic increment
const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  _id: String,
  date: String,
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model("Counter", counterSchema);

const generateOrderNumber = async () => {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  const counter = await Counter.findOneAndUpdate(
    { _id: "order", date: today },
    { $inc: { seq: 1 }, $setOnInsert: { date: today } },
    { upsert: true, new: true }
  );

  // Reset daily: if date changed, seq was set to 1 by upsert
  const paddedSeq = String(counter.seq).padStart(4, "0");
  return `ORD-${today}-${paddedSeq}`;
};

module.exports = { generateOrderNumber };
```

---

## 3. Order Repository — `src/modules/order/order.repository.js`

```js
const Order = require("../../models/Order.model");

class OrderRepository {
  async create(data) {
    return Order.create(data);
  }

  async findById(id) {
    return Order.findById(id)
      .populate("customer", "name email phone")
      .populate("assignedStaff", "name phone")
      .populate("items.menuItem", "name image");
  }

  async findByGuestSession(guestSessionId) {
    return Order.find({ guestSessionId }).sort({ createdAt: -1 });
  }

  async findByCustomer(customerId, { page = 1, limit = 10 }) {
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      Order.find({ customer: customerId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments({ customer: customerId }),
    ]);
    return { orders, total };
  }

  async findAll({ status, page = 1, limit = 20, fromDate, toDate }) {
    const query = {};
    if (status) query.status = status;
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }

    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate("customer", "name phone")
        .populate("assignedStaff", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(query),
    ]);
    return { orders, total };
  }

  async findActiveForStaff(staffId) {
    return Order.find({
      $or: [
        { assignedStaff: staffId },
        { status: { $in: ["pending", "accepted", "preparing", "ready"] } },
      ],
    })
      .populate("customer", "name phone")
      .sort({ createdAt: -1 });
  }

  async updateStatus(id, status, updatedBy, note) {
    return Order.findByIdAndUpdate(
      id,
      {
        status,
        $push: {
          statusHistory: {
            status,
            updatedBy,
            updatedAt: new Date(),
            note,
          },
        },
      },
      { new: true }
    );
  }

  async assignStaff(id, staffId) {
    return Order.findByIdAndUpdate(id, { assignedStaff: staffId }, { new: true });
  }

  async updatePaymentStatus(id, paymentStatus, razorpayPaymentId) {
    return Order.findByIdAndUpdate(
      id,
      { paymentStatus, razorpayPaymentId },
      { new: true }
    );
  }
}

module.exports = new OrderRepository();
```

---

## 4. Order Service — `src/modules/order/order.service.js`

```js
const orderRepository = require("./order.repository");
const menuItemRepository = require("../menu/menuItem.repository");
const couponRepository = require("../coupon/coupon.repository");
const notificationService = require("../notification/notification.service");
const socketService = require("../../services/socket.service");
const { generateOrderNumber } = require("../../services/orderNumber.service");
const { calculatePricing } = require("../../../shared/utils/pricing");
const { ORDER_STATUS, isValidTransition } = require("../../../shared/constants/orderStatus");
const ApiError = require("../../utils/ApiError");
const RestaurantSettings = require("../../models/RestaurantSettings.model");

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
  }) {
    // 1. Validate and fetch menu items
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

    // 2. Build order items with price snapshots
    const orderItems = rawItems.map((raw) => {
      const menuItem = menuItems.find((m) => m._id.toString() === raw.menuItemId);
      return {
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: raw.quantity,
        subtotal: menuItem.price * raw.quantity,
      };
    });

    // 3. Get settings for pricing
    const settings = await RestaurantSettings.findOne();
    const gstPercent = settings?.gstPercent || 5;
    const deliveryChargeAmount = settings?.deliveryCharge || 0;
    const freeDeliveryAbove = settings?.freeDeliveryAbove || 0;

    // 4. Apply coupon
    let couponDiscount = 0;
    let validatedCoupon = null;
    if (couponCode) {
      validatedCoupon = await couponRepository.findByCode(couponCode);
      if (!validatedCoupon || !validatedCoupon.isActive) {
        throw ApiError.badRequest("Invalid or expired coupon");
      }
      couponDiscount = this._calculateCouponDiscount(validatedCoupon, orderItems);
    }

    // 5. Calculate pricing (using shared util)
    const pricing = calculatePricing({
      items: orderItems,
      orderType,
      gstPercent,
      deliveryCharge: deliveryChargeAmount,
      freeDeliveryAbove,
      couponDiscount,
    });

    // 6. Validate delivery address if needed
    if (orderType === "delivery" && !deliveryAddress) {
      throw ApiError.badRequest("Delivery address required");
    }
    if (orderType === "dine-in" && !tableNumber) {
      throw ApiError.badRequest("Table number required for dine-in");
    }
    if (orderType === "delivery" && !guestPhone && !customerId) {
      throw ApiError.badRequest("Phone number required for delivery");
    }

    // 7. Generate order number
    const orderNumber = await generateOrderNumber();

    // 8. Create order
    const orderData = {
      orderNumber,
      customer: customerId || null,
      guestSessionId: customerId ? null : guestSessionId,
      guestName,
      guestPhone,
      items: orderItems,
      orderType,
      tableNumber: tableNumber || null,
      deliveryAddress: orderType === "delivery" ? deliveryAddress : null,
      ...pricing,
      gstPercent,
      couponCode: validatedCoupon?.code,
      paymentMethod,
      paymentStatus: paymentMethod === "cash" ? "pending" : "pending",
      status: ORDER_STATUS.PENDING,
      statusHistory: [{ status: ORDER_STATUS.PENDING, updatedAt: new Date() }],
      isGuestOrder: !customerId,
      specialInstructions,
    };

    const order = await orderRepository.create(orderData);

    // 9. Increment coupon usage
    if (validatedCoupon) {
      await couponRepository.incrementUsage(validatedCoupon._id);
    }

    // 10. Notify admin via socket
    socketService.emitToAdmins("new-order", { order });
    socketService.emitToStaff("new-order", { order });

    // 11. Create notification for admin
    await notificationService.createForAdmins({
      type: "new_order",
      title: "New Order Received! 🔔",
      message: `Order ${orderNumber} for ₹${pricing.totalAmount}`,
      orderId: order._id,
    });

    return order;
  }

  async updateStatus(orderId, newStatus, updatedById, note) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw ApiError.notFound("Order not found");

    if (!isValidTransition(order.status, newStatus)) {
      throw ApiError.badRequest(
        `Cannot change status from "${order.status}" to "${newStatus}"`
      );
    }

    const updated = await orderRepository.updateStatus(orderId, newStatus, updatedById, note);

    // Emit socket event
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

    // Create notification for customer
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

  _calculateCouponDiscount(coupon, items) {
    const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
    if (subtotal < coupon.minOrderAmount) return 0;

    if (coupon.type === "flat") return Math.min(coupon.value, subtotal);

    // percentage
    const discount = (subtotal * coupon.value) / 100;
    return coupon.maxDiscount ? Math.min(discount, coupon.maxDiscount) : discount;
  }

  _getStatusTitle(status) {
    const titles = {
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

module.exports = new OrderService();
```

---

## 5. Order Controller — `src/modules/order/order.controller.js`

```js
const orderService = require("./order.service");
const orderRepository = require("./order.repository");
const ApiResponse = require("../../utils/ApiResponse");
const ApiError = require("../../utils/ApiError");
const asyncHandler = require("../../utils/asyncHandler");

const createOrder = asyncHandler(async (req, res) => {
  const {
    items, orderType, tableNumber, deliveryAddress,
    paymentMethod, couponCode, specialInstructions,
    guestSessionId, guestName, guestPhone,
  } = req.body;

  const order = await orderService.createOrder({
    customerId: req.user?._id,
    guestSessionId,
    guestName,
    guestPhone,
    items,
    orderType,
    tableNumber,
    deliveryAddress,
    paymentMethod,
    couponCode,
    specialInstructions,
  });

  return ApiResponse.created(res, "Order placed successfully", order);
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await orderRepository.findById(req.params.id);
  if (!order) throw ApiError.notFound("Order not found");

  // Access control: user, guest, admin, or staff
  const { guestSessionId } = req.query;
  const isOwner = req.user?._id?.toString() === order.customer?._id?.toString();
  const isGuestOwner = guestSessionId && order.guestSessionId === guestSessionId;
  const isAdminOrStaff = req.user && ["admin", "staff"].includes(req.user.role);

  if (!isOwner && !isGuestOwner && !isAdminOrStaff) {
    throw ApiError.forbidden("Access denied");
  }

  return ApiResponse.success(res, "Order details", order);
});

const getAllOrders = asyncHandler(async (req, res) => {
  const { status, page, limit, fromDate, toDate } = req.query;
  const { orders, total } = await orderRepository.findAll({ status, page, limit, fromDate, toDate });
  return ApiResponse.paginated(res, "Orders", orders, page, limit, total);
});

const getMyOrders = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const { orders, total } = await orderRepository.findByCustomer(req.user._id, { page, limit });
  return ApiResponse.paginated(res, "My orders", orders, page, limit, total);
});

const getStaffOrders = asyncHandler(async (req, res) => {
  const orders = await orderRepository.findActiveForStaff(req.user._id);
  return ApiResponse.success(res, "Staff orders", orders);
});

const updateStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const order = await orderService.updateStatus(req.params.id, status, req.user._id, note);
  return ApiResponse.success(res, "Order status updated", order);
});

const cancelOrder = asyncHandler(async (req, res) => {
  const order = await orderService.updateStatus(req.params.id, "cancelled", req.user?._id);
  return ApiResponse.success(res, "Order cancelled", order);
});

const assignStaff = asyncHandler(async (req, res) => {
  const { staffId } = req.body;
  const order = await orderRepository.assignStaff(req.params.id, staffId);
  return ApiResponse.success(res, "Staff assigned", order);
});

module.exports = {
  createOrder,
  getOrderById,
  getAllOrders,
  getMyOrders,
  getStaffOrders,
  updateStatus,
  cancelOrder,
  assignStaff,
};
```

---

## 6. Order Routes — `src/modules/order/order.routes.js`

```js
const router = require("express").Router();
const ctrl = require("./order.controller");
const { authenticate, optionalAuth } = require("../../middleware/auth.middleware");
const { requireRole } = require("../../middleware/role.middleware");

router.post("/", optionalAuth, ctrl.createOrder);
router.get("/", authenticate, requireRole("admin"), ctrl.getAllOrders);
router.get("/my", authenticate, ctrl.getMyOrders);
router.get("/staff", authenticate, requireRole("staff", "admin"), ctrl.getStaffOrders);
router.get("/:id", optionalAuth, ctrl.getOrderById);
router.patch("/:id/status", authenticate, requireRole("staff", "admin"), ctrl.updateStatus);
router.patch("/:id/cancel", optionalAuth, ctrl.cancelOrder);
router.patch("/:id/assign", authenticate, requireRole("admin"), ctrl.assignStaff);

module.exports = router;
```

---

## 7. Frontend: Cart Slice — `src/features/cart/cartSlice.ts`

```ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ICartItem } from "@shared/types";

interface CartState {
  items: ICartItem[];
  couponCode: string | null;
  couponDiscount: number;
}

const initialState: CartState = {
  items: JSON.parse(localStorage.getItem("cart") || "[]"),
  couponCode: null,
  couponDiscount: 0,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addItem(state, action: PayloadAction<ICartItem>) {
      const existing = state.items.find((i) => i.menuItemId === action.payload.menuItemId);
      if (existing) {
        existing.quantity += 1;
      } else {
        state.items.push({ ...action.payload, quantity: 1 });
      }
      localStorage.setItem("cart", JSON.stringify(state.items));
    },
    removeItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.menuItemId !== action.payload);
      localStorage.setItem("cart", JSON.stringify(state.items));
    },
    updateQuantity(state, action: PayloadAction<{ menuItemId: string; quantity: number }>) {
      const item = state.items.find((i) => i.menuItemId === action.payload.menuItemId);
      if (item) {
        if (action.payload.quantity <= 0) {
          state.items = state.items.filter((i) => i.menuItemId !== action.payload.menuItemId);
        } else {
          item.quantity = action.payload.quantity;
        }
      }
      localStorage.setItem("cart", JSON.stringify(state.items));
    },
    clearCart(state) {
      state.items = [];
      state.couponCode = null;
      state.couponDiscount = 0;
      localStorage.removeItem("cart");
    },
    applyCoupon(state, action: PayloadAction<{ code: string; discount: number }>) {
      state.couponCode = action.payload.code;
      state.couponDiscount = action.payload.discount;
    },
    removeCoupon(state) {
      state.couponCode = null;
      state.couponDiscount = 0;
    },
  },
});

export const { addItem, removeItem, updateQuantity, clearCart, applyCoupon, removeCoupon } =
  cartSlice.actions;
export default cartSlice.reducer;
```

---

## Next → `09-payment-module.md`
