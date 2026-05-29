import React from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { ShoppingBag, User, UtensilsCrossed, LogOut } from "lucide-react";
import { ThemeToggle } from "../components/ThemeToggle";
import { MobileBottomDock } from "../components/layout/MobileBottomDock";
import { DesktopOffersBar } from "../components/layout/DesktopOffersBar";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export const MainLayout: React.FC = () => {
  const { itemCount } = useCart();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 md:h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group min-w-0">
            <div className="p-1.5 md:p-2 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-all shrink-0">
              <UtensilsCrossed className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <span className="text-base md:text-xl font-black bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent truncate">
              Apna Restorant
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link to="/menu" className="text-sm font-semibold hover:text-orange-500 transition-colors">
              Menu
            </Link>
            <Link to="/orders" className="text-sm font-semibold hover:text-orange-500 transition-colors">
              Orders
            </Link>
            {isAuthenticated && (
              <Link to="/profile" className="text-sm font-semibold hover:text-orange-500 transition-colors">
                Profile
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            <ThemeToggle />

            <Link
              to="/cart"
              className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all select-none"
            >
              <ShoppingBag className="w-5 h-5 text-slate-700 dark:text-slate-200" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-0.5 bg-orange-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/profile"
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  title={user?.name}
                >
                  <User className="w-5 h-5 text-slate-700 dark:text-slate-200" />
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-500 hover:text-red-500 transition-all cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden sm:flex p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all select-none"
              >
                <User className="w-5 h-5 text-slate-700 dark:text-slate-200" />
              </Link>
            )}
          </div>
        </div>
      </header>

      <DesktopOffersBar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 pb-[9.5rem] md:pb-8">
        <Outlet />
      </main>

      <footer className="hidden md:block border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-950/50 py-8 mb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500 dark:text-slate-400">
          <div>&copy; 2026 Apna Restorant. Made with ❤️.</div>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:underline">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:underline">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>

      <MobileBottomDock />
    </div>
  );
};
