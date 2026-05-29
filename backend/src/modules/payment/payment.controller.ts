import { Request, Response } from "express";
import paymentService from "./payment.service";
import paymentRepository from "./payment.repository";
import ApiResponse from "../../utils/ApiResponse";
import asyncHandler from "../../utils/asyncHandler";

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.body;
  const data = await paymentService.createOrder(orderId);
  return ApiResponse.success(res, "Razorpay order created", data);
});

export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  const order = await paymentService.verifyPayment({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  });
  return ApiResponse.success(res, "Payment verified successfully", order);
});

export const webhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers["x-razorpay-signature"];
  await paymentService.handleWebhook(req.body, signature);
  res.json({ received: true });
});

export const getPaymentDetails = asyncHandler(async (req: Request, res: Response) => {
  const payment = await paymentRepository.findByOrderId(req.params.orderId);
  return ApiResponse.success(res, "Payment details", payment);
});
