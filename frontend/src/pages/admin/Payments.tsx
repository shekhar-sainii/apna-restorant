import React, { useState, useEffect, useCallback } from "react";
import { RefreshCw, AlertCircle, Search, CreditCard, X, QrCode } from "lucide-react";
import { Table } from "../../components/common/Table";
import type { Column } from "../../components/common/Table";
import { Button } from "../../components/common/Button";
import orderService from "../../services/orderService";
import type { Order, OrderStatus, PaymentMethod } from "../../services/orderService";
import { socket } from "../../services/socket";
import authService from "../../services/authService";

export const Payments: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal State
  const [modalOrder, setModalOrder] = useState<Order | null>(null);
  const [modalPayMethod, setModalPayMethod] = useState<"cash" | "online">("cash");
  const [modalPayStatus, setModalPayStatus] = useState<"pending" | "paid" | "failed">("pending");
  const [showQrPopup, setShowQrPopup] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await orderService.getAll({ limit: 100 });
      setOrders(res.data ?? []);
    } catch (err: any) {
      setError(err.message || "Failed to load payment transactions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    const token = authService.getToken();
    if (token) {
      socket.auth = { token };
    }
    socket.connect();

    socket.emit("join-admin-room");

    const handleNewOrder = (data: { order: Order }) => {
      setOrders((prev) => {
        if (prev.some((o) => o._id === data.order._id)) return prev;
        return [data.order, ...prev];
      });
    };

    const handleStatusUpdated = (data: { orderId: string; status: OrderStatus }) => {
      setOrders((prev) =>
        prev.map((o) => (o._id === data.orderId ? { ...o, status: data.status } : o))
      );
    };

    const handlePaymentStatusUpdated = (data: { orderId: string; paymentStatus: string; paymentMethod?: string }) => {
      setOrders((prev) =>
        prev.map((o) =>
          o._id === data.orderId
            ? {
                ...o,
                paymentStatus: data.paymentStatus,
                ...(data.paymentMethod ? { paymentMethod: data.paymentMethod as PaymentMethod } : {})
              }
            : o
        )
      );
    };

    socket.on("new-order", handleNewOrder);
    socket.on("order-status-updated", handleStatusUpdated);
    socket.on("payment-status-updated", handlePaymentStatusUpdated);

    return () => {
      socket.off("new-order", handleNewOrder);
      socket.off("order-status-updated", handleStatusUpdated);
      socket.off("payment-status-updated", handlePaymentStatusUpdated);
    };
  }, [fetchOrders]);

  const openModal = (order: Order, method?: "cash" | "online") => {
    setModalOrder(order);
    setModalPayMethod(method ?? order.paymentMethod ?? "cash");
    setModalPayStatus(order.paymentStatus as any);
    setShowQrPopup(false);
  };

  const handleModalSave = async () => {
    if (!modalOrder) return;
    setIsSaving(true);
    try {
      let updatedOrder = { ...modalOrder };

      // Update Payment Details
      const res = (await orderService.updatePaymentStatus(modalOrder._id, modalPayStatus, modalPayMethod)) as any;
      if (res.data) {
        updatedOrder = {
          ...updatedOrder,
          paymentStatus: res.data.paymentStatus,
          paymentMethod: res.data.paymentMethod as PaymentMethod
        };
      } else {
        updatedOrder = {
          ...updatedOrder,
          paymentStatus: modalPayStatus,
          paymentMethod: modalPayMethod
        };
      }

      // Update local state
      setOrders((prev) =>
        prev.map((o) => (o._id === modalOrder._id ? updatedOrder : o))
      );
      setModalOrder(null);
    } catch (err: any) {
      alert(err.message || "Failed to update payment details");
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.customer?.name ?? o.guestName ?? "Guest")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesMethod = methodFilter === "all" ? true : o.paymentMethod === methodFilter;
    const matchesStatus = statusFilter === "all" ? true : o.paymentStatus === statusFilter;
    return matchesSearch && matchesMethod && matchesStatus;
  });

  const columns: Column<Order>[] = [
    {
      header: "Order #",
      accessor: (row) => <span className="font-extrabold text-orange-500">{row.orderNumber}</span>,
    },
    {
      header: "Date & Time",
      accessor: (row) => {
        const date = new Date(row.createdAt);
        return (
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
            {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        );
      },
    },
    {
      header: "Customer",
      accessor: (row) => (
        <div>
          <p className="font-bold text-sm">{row.customer?.name ?? row.guestName ?? "Guest"}</p>
          <p className="text-xs text-slate-400 font-semibold">
            {(row.customer as any)?.phone ?? row.guestPhone ?? "No Contact"}
          </p>
        </div>
      ),
    },
    {
      header: "Method",
      accessor: (row) => (
        <span className="text-xs font-bold capitalize text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
          {row.paymentMethod}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: (row) => (
        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-black capitalize ${
          row.paymentStatus === "paid"
            ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300"
            : row.paymentStatus === "failed"
            ? "bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300"
            : "bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300"
        }`}>
          {row.paymentStatus}
        </span>
      ),
    },
    {
      header: "Total",
      accessor: (row) => <span className="font-black text-slate-850 dark:text-slate-150">₹{row.totalAmount}</span>,
    },
    {
      header: "Actions",
      accessor: (row) => {
        const isPaid = row.paymentStatus === "paid";
        return (
          <div className="flex items-center gap-1.5">
            {!isPaid && row.status !== "cancelled" ? (
              <button
                onClick={() => openModal(row)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-black border border-orange-500/30 bg-orange-50 hover:bg-orange-100 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400 transition-all cursor-pointer shadow-sm"
              >
                Manage Payment
              </button>
            ) : (
              <span className="text-xs text-slate-400 font-bold">—</span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-orange-500" />
            Payment Management
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Audit payment receipts, update statuses, and track revenue
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-all cursor-pointer"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Order # or Customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          
          {/* Method Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-2xl">
            <span className="text-[10px] font-black uppercase text-slate-400">Method:</span>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="bg-transparent border-0 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none capitalize"
            >
              <option value="all">All Methods</option>
              <option value="cash">Cash</option>
              <option value="online">Online</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-2xl">
            <span className="text-[10px] font-black uppercase text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-0 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none capitalize"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
            </select>
          </div>

        </div>

      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 text-sm font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Main Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <span className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <Table columns={columns} data={filtered} keyExtractor={(o) => o._id} />
      )}

      {/* Manage Order Modal */}
      {modalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden transform transition-all flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-orange-500" />
                  Payment Details - Order #{modalOrder.orderNumber}
                </h3>
                <p className="text-slate-400 text-xs mt-0.5 font-bold">
                  {modalOrder.customer?.name ?? modalOrder.guestName ?? "Guest"} • {modalOrder.orderType}
                </p>
              </div>
              <button
                onClick={() => setModalOrder(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col gap-6">
              
              {/* Payment Details Section */}
              <div className="flex flex-col gap-4">
                {modalOrder.status === "cancelled" ? (
                  <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/50 text-amber-600 dark:text-amber-400 text-xs font-bold leading-relaxed">
                    ⚠️ Payment details cannot be modified for a cancelled order.
                  </div>
                ) : (
                  <>
                    {/* Payment Method Selector */}
                    <div>
                      <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                        Payment Method
                      </span>
                      <div className="flex gap-2">
                        {(["cash", "online"] as const).map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setModalPayMethod(m)}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-black capitalize transition-all border cursor-pointer ${
                              modalPayMethod === m
                                ? "bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/20"
                                : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>

                    {modalPayMethod === "cash" ? (
                      <>
                        {/* Payment Status Selector */}
                        <div>
                          <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                            Payment Status
                          </span>
                          <div className="flex gap-2">
                            {(["pending", "paid", "failed"] as const).map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setModalPayStatus(s)}
                                className={`flex-1 py-2.5 rounded-xl text-xs font-black capitalize transition-all border cursor-pointer ${
                                  modalPayStatus === s
                                    ? "bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/20"
                                    : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
                                }`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col gap-2 mt-2">
                        <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          Online UPI Payment
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowQrPopup(true)}
                          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-sm shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <QrCode className="w-5 h-5 animate-pulse" />
                          Generate UPI QR Code
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <Button
                variant="outline"
                onClick={() => setModalOrder(null)}
                disabled={isSaving}
                className="font-bold text-xs !px-4 !py-2"
              >
                Cancel
              </Button>
              {modalPayMethod === "cash" && (
                <Button
                  variant="primary"
                  onClick={handleModalSave}
                  loading={isSaving}
                  className="font-bold text-xs !px-5 !py-2 shadow-md shadow-orange-500/10"
                >
                  Save Changes
                </Button>
              )}
            </div>

          </div>
        </div>
      )}

      {showQrPopup && modalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm shadow-2xl p-6 relative flex flex-col items-center gap-4 text-center">
            <button
              onClick={() => setShowQrPopup(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center text-orange-500 mb-2">
              <QrCode className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-lg font-black text-slate-800 dark:text-slate-100">Scan to Pay</h4>
              <p className="text-xs text-slate-400 font-bold mt-0.5">Order #{modalOrder.orderNumber}</p>
            </div>

            <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-inner flex items-center justify-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  `upi://pay?pa=apnarestorant@upi&pn=Apna%20Restorant&am=${modalOrder.totalAmount}&cu=INR&tn=Order%20${modalOrder.orderNumber}`
                )}`}
                alt="UPI QR Code"
                className="w-44 h-44 object-contain"
              />
            </div>

            <div className="text-sm font-extrabold text-slate-700 dark:text-slate-200">
              Amount: <span className="text-orange-500 text-base font-black">₹{modalOrder.totalAmount}</span>
            </div>

            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed max-w-[240px]">
              Scan QR via any UPI App (GPay, PhonePe, Paytm) to complete the transaction.
            </p>

            <div className="w-full flex flex-col gap-2 mt-2">
              <Button
                variant="primary"
                onClick={async () => {
                  setShowQrPopup(false);
                  try {
                    setIsSaving(true);
                    let updatedOrder = { ...modalOrder, paymentStatus: "paid", paymentMethod: modalPayMethod };
                    const res = (await orderService.updatePaymentStatus(modalOrder._id, "paid", modalPayMethod)) as any;
                    if (res.data) {
                      updatedOrder = {
                        ...updatedOrder,
                        paymentStatus: res.data.paymentStatus,
                        paymentMethod: res.data.paymentMethod as PaymentMethod
                      };
                    }
                    setOrders((prev) =>
                      prev.map((o) => (o._id === modalOrder._id ? updatedOrder : o))
                    );
                    setModalOrder(null);
                  } catch (err: any) {
                    alert(err.message || "Failed to mark as paid");
                  } finally {
                    setIsSaving(false);
                  }
                }}
                className="w-full font-black text-xs !py-3 shadow-md shadow-orange-500/20"
              >
                Mark as Paid
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowQrPopup(false)}
                className="w-full font-bold text-xs !py-2.5"
              >
                Close QR Code
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Payments;
