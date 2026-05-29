import { lazy, Suspense } from "react";
import type { RouteObject } from "react-router-dom";
import { MainLayout } from "../layouts/MainLayout";
import { AuthLayout } from "../layouts/AuthLayout";
import { AdminLayout } from "../layouts/AdminLayout";
import ProtectedRoute from "../components/ProtectedRoute";

// ── Lazy-loaded Customer Pages ────────────────────────────────────────────────
const Home            = lazy(() => import("../pages/customer/Home"));
const Menu            = lazy(() => import("../pages/customer/Menu"));
const Cart            = lazy(() => import("../pages/customer/Cart"));
const Checkout        = lazy(() => import("../pages/customer/Checkout"));
const Orders          = lazy(() => import("../pages/customer/Orders"));
const OrderTracking   = lazy(() => import("../pages/customer/OrderTracking"));
const Profile         = lazy(() => import("../pages/customer/Profile"));
const Notifications   = lazy(() => import("../pages/customer/Notifications"));
const TableLanding    = lazy(() => import("../pages/customer/TableLanding"));

// ── Lazy-loaded Auth Pages ────────────────────────────────────────────────────
const Login           = lazy(() => import("../pages/auth/Login"));
const Register        = lazy(() => import("../pages/auth/Register"));
const ForgotPassword  = lazy(() => import("../pages/auth/ForgotPassword"));
const ResetPassword   = lazy(() => import("../pages/auth/ResetPassword"));

// ── Lazy-loaded Admin Pages ───────────────────────────────────────────────────
const Dashboard       = lazy(() => import("../pages/admin/Dashboard"));
const AdminOrders     = lazy(() => import("../pages/admin/Orders"));
const AdminMenuItems  = lazy(() => import("../pages/admin/MenuItems"));
const AdminCategories = lazy(() => import("../pages/admin/Categories"));
const AdminTables     = lazy(() => import("../pages/admin/Tables"));
const AdminCoupons    = lazy(() => import("../pages/admin/Coupons"));
const AdminUsers      = lazy(() => import("../pages/admin/Users"));
const AdminReports    = lazy(() => import("../pages/admin/Reports"));
const AdminSettings   = lazy(() => import("../pages/admin/Settings"));
const AdminNotifications = lazy(() => import("../pages/admin/Notifications"));

// ── Lazy-loaded Error Pages ───────────────────────────────────────────────────
const NotFound        = lazy(() => import("../pages/error/NotFound"));
const ServerError     = lazy(() => import("../pages/error/ServerError"));

// Suspense fallback shown while lazy chunks load
const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <span className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const withSuspense = (element: React.ReactElement) => (
  <Suspense fallback={<PageLoader />}>{element}</Suspense>
);

export const routes: RouteObject[] = [
  // ── Customer Routes ──────────────────────────────────────────────────────────
  {
    path: "/",
    element: <MainLayout />,
    children: [
      // Guest-accessible (no auth required)
      { index: true,                    element: withSuspense(<Home />) },
      { path: "menu",                   element: withSuspense(<Menu />) },
      { path: "t/:tableNumber",         element: withSuspense(<TableLanding />) },
      { path: "cart",                   element: withSuspense(<Cart />) },
      { path: "checkout",               element: withSuspense(<Checkout />) },
      { path: "orders",                 element: withSuspense(<Orders />) },
      { path: "orders/:id/track",       element: withSuspense(<OrderTracking />) },

      // Login-required routes (customer | admin | staff)
      {
        element: <ProtectedRoute allowedRoles={["user", "admin", "staff"]} />,
        children: [
          { path: "profile",            element: withSuspense(<Profile />) },
          { path: "notifications",      element: withSuspense(<Notifications />) }
        ]
      }
    ]
  },

  // ── Auth Routes ───────────────────────────────────────────────────────────────
  {
    path: "/",
    element: <AuthLayout />,
    children: [
      { path: "login",            element: withSuspense(<Login />) },
      { path: "register",         element: withSuspense(<Register />) },
      { path: "forgot-password",  element: withSuspense(<ForgotPassword />) },
      { path: "reset-password",   element: withSuspense(<ResetPassword />) }
    ]
  },

  // ── Admin Routes (admin role only — guard is inside AdminLayout) ─────────────
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true,             element: withSuspense(<Dashboard />) },
      { path: "orders",          element: withSuspense(<AdminOrders />) },
      { path: "menu",            element: withSuspense(<AdminMenuItems />) },
      { path: "categories",      element: withSuspense(<AdminCategories />) },
      { path: "tables",          element: withSuspense(<AdminTables />) },
      { path: "coupons",         element: withSuspense(<AdminCoupons />) },
      { path: "users",           element: withSuspense(<AdminUsers />) },
      { path: "reports",         element: withSuspense(<AdminReports />) },
      { path: "notifications",   element: withSuspense(<AdminNotifications />) },
      { path: "settings",        element: withSuspense(<AdminSettings />) }
    ]
  },

  // ── Error Routes ──────────────────────────────────────────────────────────────
  { path: "/500",  element: withSuspense(<ServerError />) },
  { path: "*",     element: withSuspense(<NotFound />) }
];
