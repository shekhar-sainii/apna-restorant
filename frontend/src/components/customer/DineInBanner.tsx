import React from "react";
import { Utensils, X } from "lucide-react";
import { getDineInSession, clearDineInSession } from "../../utils/dineInSession";

interface DineInBannerProps {
  onLeave?: () => void;
}

export const DineInBanner: React.FC<DineInBannerProps> = ({ onLeave }) => {
  const session = getDineInSession();
  if (!session) return null;

  const handleLeave = () => {
    clearDineInSession();
    onLeave?.();
    window.location.href = "/menu";
  };

  return (
    <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20">
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2 rounded-xl bg-white/20 shrink-0">
          <Utensils className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">
            Dine-in · Table auto-selected
          </p>
          <p className="font-black text-sm truncate">
            {session.tableLabel} (#{session.tableNumber})
          </p>
          {session.status === "occupied" && (
            <p className="text-[10px] text-white/90 mt-0.5">Table marked busy — order still OK</p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={handleLeave}
        className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 shrink-0 cursor-pointer"
        title="Switch to online delivery"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default DineInBanner;
