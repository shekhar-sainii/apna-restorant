import React, { useState, useEffect } from "react";
import { TrendingUp, ShoppingBag, DollarSign, Clock } from "lucide-react";
import orderService from "../../services/orderService";
import type { Order } from "../../services/orderService";

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300",
  accepted:  "bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300",
  preparing: "bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300",
  ready:     "bg-cyan-100 dark:bg-cyan-950/50 text-cyan-800 dark:text-cyan-300",
  delivered: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300",
  cancelled: "bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300",
};

export const Dashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderService.getAll({ limit: 50 })
      .then((res) => setOrders(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = orders
    .filter((o) => o.status === "delivered")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const activeOrders = orders.filter((o) =>
    ["pending", "accepted", "preparing", "ready"].includes(o.status)
  ).length;

  const deliveredOrders = orders.filter((o) => o.status === "delivered").length;

  const pendingOrders = orders.filter((o) => o.status === "pending").length;

  const stats = [
    { name: "Total Revenue", value: `₹${totalRevenue.toLocaleString("en-IN")}`, icon: <DollarSign className="w-5 h-5" />, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { name: "Active Orders", value: String(activeOrders), icon: <ShoppingBag className="w-5 h-5" />, color: "text-blue-500", bg: "bg-blue-500/10" },
    { name: "Delivered Today", value: String(deliveredOrders), icon: <TrendingUp className="w-5 h-5" />, color: "text-purple-500", bg: "bg-purple-500/10" },
    { name: "Pending Orders", value: String(pendingOrders), icon: <Clock className="w-5 h-5" />, color: "text-amber-500", bg: "bg-amber-500/10" },
  ];

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-200">Dashboard Overview</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Real-time metrics and restaurant statistics</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <span className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.name} className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">{stat.name}</span>
                  <span className="text-2xl font-black mt-1 block text-slate-800 dark:text-slate-200">{stat.value}</span>
                </div>
                <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>{stat.icon}</div>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
            <h3 className="font-extrabold text-lg mb-4 text-slate-800 dark:text-slate-200">Recent Orders</h3>
            {recentOrders.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No orders yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                      <th className="pb-3">Order #</th>
                      <th className="pb-3">Customer</th>
                      <th className="pb-3">Items</th>
                      <th className="pb-3">Total</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order._id} className="border-b border-slate-100/50 dark:border-slate-800/50 text-slate-700 dark:text-slate-300">
                        <td className="py-4 font-bold text-orange-500">{order.orderNumber}</td>
                        <td className="py-4 font-semibold">{order.customer?.name ?? order.guestName ?? "Guest"}</td>
                        <td className="py-4 text-xs text-slate-500">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</td>
                        <td className="py-4 font-extrabold">₹{order.totalAmount}</td>
                        <td className="py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${STATUS_COLORS[order.status] ?? ""}`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
export default Dashboard;
