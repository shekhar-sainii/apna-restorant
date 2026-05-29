import { Request, Response } from "express";
import orderService from "./order.service";
import orderRepository from "./order.repository";
import ApiResponse from "../../utils/ApiResponse";
import ApiError from "../../utils/ApiError";
import asyncHandler from "../../utils/asyncHandler";

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const {
    items, orderType, tableNumber, deliveryAddress,
    paymentMethod, couponCode, specialInstructions,
    guestSessionId, guestName, guestPhone,
  } = req.body;

  const order = await orderService.createOrder({
    customerId: req.user?._id?.toString(),
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

export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderRepository.findById(req.params.id);
  if (!order) throw ApiError.notFound("Order not found");

  const { guestSessionId } = req.query;
  const orderCustomerId = (order.customer as any)?._id ? (order.customer as any)._id.toString() : order.customer?.toString();
  const isOwner = req.user?._id?.toString() === orderCustomerId;
  const isGuestOwner = guestSessionId && order.guestSessionId === guestSessionId;
  const isAdminOrStaff = req.user && ["admin", "staff"].includes(req.user.role);

  if (!isOwner && !isGuestOwner && !isAdminOrStaff) {
    throw ApiError.forbidden("Access denied");
  }

  return ApiResponse.success(res, "Order details", order);
});

export const getAllOrders = asyncHandler(async (req: Request, res: Response) => {
  const { status, page, limit, fromDate, toDate } = req.query;
  const { orders, total } = await orderRepository.findAll({
    status: status ? String(status) : undefined,
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
    fromDate: fromDate ? String(fromDate) : undefined,
    toDate: toDate ? String(toDate) : undefined,
  });
  return ApiResponse.paginated(res, "Orders", orders, Number(page) || 1, Number(limit) || 20, total);
});

export const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized("Authentication required");
  const { page, limit } = req.query;
  const { orders, total } = await orderRepository.findByCustomer(req.user._id, {
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 10,
  });
  return ApiResponse.paginated(res, "My orders", orders, Number(page) || 1, Number(limit) || 10, total);
});

export const getStaffOrders = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized("Authentication required");
  const orders = await orderRepository.findActiveForStaff(req.user._id);
  return ApiResponse.success(res, "Staff orders", orders);
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized("Authentication required");
  const { status, note } = req.body;
  const order = await orderService.updateStatus(req.params.id, status, req.user._id, note);
  return ApiResponse.success(res, "Order status updated", order);
});

export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.updateStatus(req.params.id, "cancelled", req.user?._id || "system");
  return ApiResponse.success(res, "Order cancelled", order);
});

export const assignStaff = asyncHandler(async (req: Request, res: Response) => {
  const { staffId } = req.body;
  const order = await orderRepository.assignStaff(req.params.id, staffId);
  return ApiResponse.success(res, "Staff assigned", order);
});
