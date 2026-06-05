import React, { useState } from "react";
import { Link, Outlet, useLocation, Navigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  Menu as MenuIcon,
  Tag,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  UtensilsCrossed,
  FolderOpen,
  Table2,
  BarChart3,
  Settings,
  Bell,
  CreditCard
} from "lucide-react";
import { ThemeToggle } from "../components/ThemeToggle";
import { useAuth } from "../context/AuthContext";
import { socket } from "../services/socket";
import authService from "../services/authService";
import { useEffect } from "react";

const MENU_GROUPS = [
  {
    label: "Core",
    items: [
      { name: "Dashboard", path: "/admin", icon: <LayoutDashboard className="w-5 h-5" />, exact: true },
      { name: "Orders", path: "/admin/orders", icon: <ShoppingBag className="w-5 h-5" /> },
      { name: "Payments", path: "/admin/payments", icon: <CreditCard className="w-5 h-5" /> }
    ]
  },
  {
    label: "Catalog",
    items: [
      { name: "Menu Items", path: "/admin/menu", icon: <MenuIcon className="w-5 h-5" /> },
      { name: "Categories", path: "/admin/categories", icon: <FolderOpen className="w-5 h-5" /> },
      { name: "Tables", path: "/admin/tables", icon: <Table2 className="w-5 h-5" /> }
    ]
  },
  {
    label: "Marketing",
    items: [
      { name: "Coupons", path: "/admin/coupons", icon: <Tag className="w-5 h-5" /> }
    ]
  },
  {
    label: "Management",
    items: [
      { name: "Users", path: "/admin/users", icon: <Users className="w-5 h-5" /> },
      { name: "Reports", path: "/admin/reports", icon: <BarChart3 className="w-5 h-5" /> }
    ]
  },
  {
    label: "System",
    items: [
      { name: "Notifications", path: "/admin/notifications", icon: <Bell className="w-5 h-5" /> },
      { name: "Settings", path: "/admin/settings", icon: <Settings className="w-5 h-5" /> }
    ]
  }
];

export const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [toast, setToast] = useState<{ orderNumber: string; totalAmount: number; id: string } | null>(null);
  const location = useLocation();
  const { isAdmin, isStaff, user, logout } = useAuth();

  useEffect(() => {
    const token = authService.getToken();
    if (token) {
      socket.auth = { token };
      socket.connect();
    }

    const handleNewOrder = (data: { order: any }) => {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } catch (e) {
        console.error("Audio error", e);
      }

      setToast({
        orderNumber: data.order.orderNumber,
        totalAmount: data.order.totalAmount,
        id: data.order._id,
      });
    };

    socket.on("new-order", handleNewOrder);

    return () => {
      socket.off("new-order", handleNewOrder);
    };
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Role guard — only admin and staff can access
  if (!isAdmin && !isStaff) {
    return <Navigate to="/login" replace />;
  }

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 h-screen z-40 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col transition-all duration-300 ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-orange-500 text-white">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <span className="font-black text-md bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Apna Admin
              </span>
            </div>
          )}
          {collapsed && (
            <div className="mx-auto p-1.5 rounded-lg bg-orange-500 text-white">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer shrink-0"
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Nav Groups */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-5 scrollbar-thin">
          {MENU_GROUPS.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-2 px-2">
                  {group.label}
                </p>
              )}
              <div className="flex flex-col gap-1">
                {group.items.map((item) => {
                  const active = isActive(item.path, (item as any).exact);
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      title={collapsed ? item.name : undefined}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all group ${
                        active
                          ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <span className="flex-shrink-0">{item.icon}</span>
                      {!collapsed && <span className="truncate">{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center font-black text-sm shrink-0">
                {user?.name?.charAt(0) ?? "A"}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs truncate text-slate-800 dark:text-slate-200">{user?.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl font-semibold text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all cursor-pointer"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="truncate">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between shrink-0">
          <h1 className="font-extrabold text-lg text-slate-800 dark:text-slate-200">Admin Panel</h1>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center font-bold text-sm">
                {user?.name?.charAt(0) ?? "A"}
              </div>
              <span className="hidden sm:inline font-semibold text-sm text-slate-700 dark:text-slate-300">
                {user?.name ?? "Administrator"}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <React.Suspense
            fallback={
              <div className="flex items-center justify-center h-64">
                <span className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            }
          >
            <Outlet />
          </React.Suspense>
        </main>
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center justify-between gap-4 p-4 rounded-3xl bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-xl shadow-orange-500/20 border border-orange-400 max-w-sm animate-bounce">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔔</span>
              <div>
                <p className="font-extrabold text-sm">New Order Received!</p>
                <p className="text-xs opacity-90 mt-0.5">Order {toast.orderNumber} · ₹{toast.totalAmount}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/admin/orders"
                onClick={() => setToast(null)}
                className="px-3 py-1.5 rounded-xl bg-white text-orange-600 font-extrabold text-xs transition-all hover:bg-orange-50 shrink-0"
              >
                View
              </Link>
              <button
                onClick={() => setToast(null)}
                className="p-1 hover:bg-white/10 rounded-lg text-white/80 transition-all cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
