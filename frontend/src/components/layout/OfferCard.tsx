import React from "react";
import type { PromoOffer } from "../../utils/offers";

interface OfferCardProps {
  offer: PromoOffer;
  onClick?: () => void;
  compact?: boolean;
}

export const OfferCard: React.FC<OfferCardProps> = ({ offer, onClick, compact }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 flex items-center gap-2.5 rounded-2xl bg-gradient-to-r ${offer.gradient} text-white shadow-md shadow-black/10 overflow-hidden text-left cursor-pointer active:scale-[0.98] transition-transform ${
        compact ? "min-w-[200px] h-[52px] px-3 py-2" : "min-w-[220px] h-[56px] px-3.5 py-2.5"
      }`}
    >
      <span className={`${compact ? "text-xl" : "text-2xl"} leading-none select-none`}>{offer.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className={`font-black leading-tight truncate ${compact ? "text-xs" : "text-sm"}`}>
          {offer.title}
        </p>
        <p className={`text-white/85 truncate ${compact ? "text-[10px]" : "text-[11px]"} font-semibold`}>
          {offer.subtitle}
        </p>
      </div>
      {offer.code && (
        <span className="shrink-0 px-2 py-1 rounded-lg bg-white/25 text-[10px] font-black tracking-wide border border-white/30">
          {offer.code}
        </span>
      )}
    </button>
  );
};
