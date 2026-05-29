import React, { useState, useEffect, useCallback } from "react";
import { RefreshCw, AlertCircle } from "lucide-react";
import { Table } from "../../components/common/Table";
import type { Column } from "../../components/common/Table";
import { Button } from "../../components/common/Button";
import orderService from "../../services/orderService";
import type { Order, OrderStatus } from "../../services/orderService";

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300",
  accepted:  "bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300",
  preparing: "bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300",
  ready:     "bg-cyan-100 dark:bg-cyan-950/50 text-cyan-800 dark:text-cyan-300",
  delivered: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300",
  cancelled: "bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300",
};

const NEXT_STATUS: Record<string, OrderStatus | null> = {
  pending:   "accepted",
  accepted:  "preparing",
  preparing: "ready",
  ready:     "delivered",
  delivered: null,
  cancelled: null,
};

const NEXT_LABEL: Record<string, string> = {
  pending:   "Accept",
  accepted:  "Start Prep",
  preparing: "Mark Ready",
  ready:     "Deliver",
};

export const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await orderService.getAll({ limit: 50 });
      setOrders(res.data ?? []);
    } catch (err: any) {
      setError(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStatusUpdate = async (order: Order) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    setUpdatingId(order._id);
    try {
      await orderService.updateStatus(order._id, next);
      setOrders((prev) => prev.map((o) => o._id === order._id ? { ...o, status: next } : o));
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = statusFilter === "all" ? orders : orders.filter((o) => o.status === statusFilter);

  const columns: Column<Order>[] = [
    {
      header: "Order #",
      accessor: (row) => <span className="font-extrabold text-orange-500">{row.orderNumber}</span>,
    },
    {
      header: "Customer",
      accessor: (row) => (
        <div>
          <p className="font-bold text-sm">{row.customer?.name ?? row.guestName ?? "Guest"}</p>
          <p className="text-xs text-slate-400">{row.orderType}</p>
        </div>
      ),
    },
    {
      header: "Items",
      accessor: (row) => (
        <span className="text-xs text-slate-600 dark:text-slate-400">
          {row.items.map((i) => `${i.menuItem?.name ?? "Item"} ×${i.quantity}`).join(", ")}
        </span>
      ),
    },
    {
      header: "Total",
      accessor: (row) => <span className="font-extrabold">₹{row.totalAmount}</span>,
    },
    {
      header: "Status",
      accessor: (row) => (
        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${STATUS_COLORS[row.status] ?? ""}`}>
          {row.status}
        </span>
      ),
    },
    {
      header: "Actions",
      accessor: (row) => {
        const next = NEXT_STATUS[row.status];
        if (!next) return <span className="text-xs text-slate-400 font-bold">—</span>;
        return (
          <Button
            onClick={() => handleStatusUpdate(row)}
            variant="primary"
            loading={updatingId === row._id}
            className="!px-3 !py-1.5 text-xs"
          >
            {NEXT_LABEL[row.status]}
          </Button>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-200">Incoming Orders</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Manage live order workflow statuses</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {["all", "pending", "accepted", "preparing", "ready", "delivered", "cancelled"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                statusFilter === s
                  ? "bg-orange-500 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              {s}
            </button>
          ))}
          <button onClick={fetchOrders} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-all cursor-pointer">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 text-sm font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <span className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <Table columns={columns} data={filtered} keyExtractor={(o) => o._id} />
      )}
    </div>
  );
};
export default Orders;
