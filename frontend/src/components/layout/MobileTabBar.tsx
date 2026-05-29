import React from "react";
import { NavLink } from "react-router-dom";
import { Home, UtensilsCrossed, ShoppingBag, ClipboardList, User } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";

interface MobileTabBarProps {
  /** When true, rendered inside MobileBottomDock (no fixed positioning). */
  embedded?: boolean;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({ embedded = false }) => {
  const { itemCount } = useCart();
  const { isAuthenticated } = useAuth();

  const tabs = [
    { to: "/", label: "Home", icon: Home, end: true },
    { to: "/menu", label: "Menu", icon: UtensilsCrossed },
    { to: "/cart", label: "Cart", icon: ShoppingBag, badge: itemCount },
    { to: "/orders", label: "Orders", icon: ClipboardList },
    {
      to: isAuthenticated ? "/profile" : "/login",
      label: isAuthenticated ? "Profile" : "Login",
      icon: User,
    },
  ];

  return (
    <nav
      className={`border-t border-slate-200/90 dark:border-slate-800/90 bg-white/95 dark:bg-slate-950/95 backdrop-blur-lg safe-area-pb ${
        embedded ? "" : "md:hidden fixed bottom-0 inset-x-0 z-50"
      }`}
      aria-label="Main navigation"
    >
      <div className="flex items-stretch justify-around h-16 max-w-lg mx-auto px-1">
        {tabs.map(({ to, label, icon: Icon, badge, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-0.5 min-w-0 px-1 transition-colors ${
                isActive
                  ? "text-orange-500"
                  : "text-slate-500 dark:text-slate-400 hover:text-orange-400"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className="relative">
                  <Icon
                    className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-2"}`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {badge != null && badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 bg-orange-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </span>
                <span className={`text-[10px] font-bold truncate w-full text-center ${isActive ? "text-orange-500" : ""}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default MobileTabBar;
