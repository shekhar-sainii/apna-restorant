import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Tag, Check } from "lucide-react";
import { useOffers } from "../../hooks/useOffers";
import { OfferCard } from "./OfferCard";
import { savePendingCoupon } from "../../utils/offers";
import { useCart } from "../../context/CartContext";

export const DesktopOffersBar: React.FC = () => {
  const { offers, loading } = useOffers();
  const { items } = useCart();
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleOfferClick = useCallback(
    async (offerId: string, code?: string) => {
      if (code) {
        savePendingCoupon(code);
        try {
          await navigator.clipboard.writeText(code);
        } catch {
          /* optional */
        }
        setCopiedId(offerId);
        setTimeout(() => setCopiedId(null), 2000);
        navigate(items.length > 0 ? "/checkout" : "/menu");
        return;
      }
      navigate("/menu");
    },
    [items.length, navigate]
  );

  if (!loading && offers.length === 0) return null;

  return (
    <div className="hidden md:block border-b border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-r from-orange-50/80 via-white to-amber-50/80 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center gap-2 mb-2.5">
          <Tag className="w-4 h-4 text-orange-500" />
          <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Today&apos;s Offers
          </span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
          {loading
            ? [1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="shrink-0 w-[220px] h-[56px] rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse"
                />
              ))
            : offers.map((offer) => (
                <div key={offer.id} className="relative shrink-0">
                  <OfferCard
                    offer={offer}
                    onClick={() => handleOfferClick(offer.id, offer.code)}
                  />
                  {copiedId === offer.id && offer.code && (
                    <span className="absolute inset-0 flex items-center justify-center gap-1 rounded-2xl bg-black/50 text-white text-xs font-bold">
                      <Check className="w-4 h-4" />
                      Copied!
                    </span>
                  )}
                </div>
              ))}
        </div>
      </div>
    </div>
  );
};

export default DesktopOffersBar;
