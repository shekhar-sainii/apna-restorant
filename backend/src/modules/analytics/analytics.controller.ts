import { Request, Response } from "express";
import Order from "../../models/Order.model";
import User from "../../models/User.model";
import MenuItem from "../../models/MenuItem.model";
import ApiResponse from "../../utils/ApiResponse";
import asyncHandler from "../../utils/asyncHandler";

export const getSummary = asyncHandler(async (_req: Request, res: Response) => {
  const [allOrders, totalUsers] = await Promise.all([
    Order.find().populate("items.menuItem", "name category"),
    User.countDocuments({ role: "user" }),
  ]);

  const delivered = allOrders.filter((o) => o.status === "delivered");
  const totalRevenue = delivered.reduce((s, o) => s + o.totalAmount, 0);
  const totalOrders = allOrders.length;
  const avgOrderValue = delivered.length ? Math.round(totalRevenue / delivered.length) : 0;

  // Status breakdown
  const statusMap: Record<string, number> = {};
  for (const o of allOrders) {
    statusMap[o.status] = (statusMap[o.status] ?? 0) + 1;
  }

  // Top menu items by order count
  const itemCount: Record<string, { name: string; count: number; revenue: number }> = {};
  for (const order of allOrders) {
    for (const item of order.items as any[]) {
      const id = item.menuItem?._id?.toString() ?? item.menuItem?.toString();
      const name = item.menuItem?.name ?? "Unknown";
      if (!id) continue;
      if (!itemCount[id]) itemCount[id] = { name, count: 0, revenue: 0 };
      itemCount[id].count += item.quantity;
      itemCount[id].revenue += item.price * item.quantity;
    }
  }

  const topItems = Object.values(itemCount)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const maxCount = topItems[0]?.count ?? 1;
  const topItemsWithPct = topItems.map((i) => ({
    ...i,
    pct: Math.round((i.count / maxCount) * 100),
  }));

  // Category revenue
  const allMenuItems = await MenuItem.find().populate("category", "name");
  const catRevMap: Record<string, { name: string; revenue: number }> = {};
  for (const order of delivered) {
    for (const item of order.items as any[]) {
      const mi = allMenuItems.find((m) => m._id.toString() === (item.menuItem?._id?.toString() ?? item.menuItem?.toString()));
      if (!mi) continue;
      const catName = (mi.category as any)?.name ?? "Other";
      if (!catRevMap[catName]) catRevMap[catName] = { name: catName, revenue: 0 };
      catRevMap[catName].revenue += item.price * item.quantity;
    }
  }

  const categoryRevenue = Object.values(catRevMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  const maxRev = categoryRevenue[0]?.revenue ?? 1;
  const categoryRevenueWithPct = categoryRevenue.map((c) => ({
    ...c,
    pct: Math.round((c.revenue / maxRev) * 100),
  }));

  return ApiResponse.success(res, "Analytics summary", {
    totalRevenue,
    totalOrders,
    totalUsers,
    avgOrderValue,
    statusBreakdown: statusMap,
    topItems: topItemsWithPct,
    categoryRevenue: categoryRevenueWithPct,
  });
});
