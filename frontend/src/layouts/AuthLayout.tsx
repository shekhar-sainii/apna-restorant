import React from "react";
import { Outlet } from "react-router-dom";
import { ThemeToggle } from "../components/ThemeToggle";

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center items-center p-4 transition-colors duration-300 relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />

      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <span className="text-3xl">🍕</span>
          <h2 className="text-2xl font-black mt-2 bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
            Apna Restorant
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Taste of home, delivered with love</p>
        </div>
        
        <Outlet />
      </div>
    </div>
  );
};
