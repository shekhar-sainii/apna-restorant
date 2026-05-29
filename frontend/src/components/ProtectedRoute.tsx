import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";


interface ProtectedRouteProps {
  /** Allowed roles for this route. If empty, any authenticated user can access. */
  allowedRoles?: string[];
  /** Route to redirect to when access is denied */
  redirectTo?: string;
}

/**
 * ProtectedRoute wraps any route that needs role-based access control.
 *
 * - Admin routes: only "admin" role
 * - Customer routes (checkout, orders, profile): "customer" | "admin"
 * - Guest-accessible routes (home, menu): everyone — no guard needed
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles = ["customer", "admin"],
  redirectTo = "/login"
}) => {
  const { role } = useAuth();

  if (!allowedRoles.includes(role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
