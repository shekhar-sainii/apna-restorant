import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Tag, ChevronRight, Check } from "lucide-react";
import { useOffers } from "../../hooks/useOffers";
import { OfferCard } from "./OfferCard";
import { savePendingCoupon } from "../../utils/offers";
import { useCart } from "../../context/CartContext";

export const OffersStrip: React.FC = () => {
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
          /* clipboard optional */
        }
        setCopiedId(offerId);
        setTimeout(() => setCopiedId(null), 2000);
        if (items.length > 0) {
          navigate("/checkout");
        } else {
          navigate("/menu");
        }
        return;
      }
      navigate("/menu");
    },
    [items.length, navigate]
  );

  if (!loading && offers.length === 0) return null;

  const marqueeOffers = [...offers, ...offers];

  return (
    <div className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md">
      <div className="flex items-center gap-2 px-3 pt-2 pb-1">
        <Tag className="w-3.5 h-3.5 text-orange-500 shrink-0" />
        <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide">
          Offers & Coupons
        </span>
        <ChevronRight className="w-3 h-3 text-slate-400" />
      </div>

      {loading ? (
        <div className="flex gap-2 px-3 pb-2.5 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="shrink-0 w-[200px] h-[52px] rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="offers-marquee-mask pb-2.5">
          <div className="offers-marquee-track gap-2.5 px-3">
            {marqueeOffers.map((offer, idx) => (
              <div key={`${offer.id}-${idx}`} className="relative shrink-0">
                <OfferCard
                  offer={offer}
                  compact
                  onClick={() => handleOfferClick(`${offer.id}-${idx}`, offer.code)}
                />
                {copiedId === `${offer.id}-${idx}` && offer.code && (
                  <span className="absolute inset-0 flex items-center justify-center gap-1 rounded-2xl bg-black/50 text-white text-[10px] font-bold">
                    <Check className="w-3 h-3" />
                    Copied!
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OffersStrip;
