import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  compact?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, compact = false, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            className={`block font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${
              compact ? "text-[10px] mb-1" : "text-xs mb-2"
            }`}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none opacity-50">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={`w-full ${icon ? "pl-10" : "pl-4"} pr-4 ${
              compact ? "py-2 rounded-xl text-sm" : "py-3 rounded-2xl text-sm"
            } border ${
              error
                ? "border-red-500 focus:ring-red-500"
                : "border-slate-200 dark:border-slate-800 focus:ring-orange-500"
            } bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all ${className}`}
            {...props}
          />
        </div>
        {error && <span className="text-xs text-red-500 font-medium mt-1.5 block">{error}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";
export default Input;
