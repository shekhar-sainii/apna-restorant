import { useEffect, useState } from "react";
import couponService from "../services/couponService";
import {
  STATIC_PROMOS,
  couponToPromo,
  type PromoOffer,
} from "../utils/offers";

export function useOffers() {
  const [offers, setOffers] = useState<PromoOffer[]>(STATIC_PROMOS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await couponService.getActive();
        if (cancelled) return;
        const fromApi = (res.data ?? []).map(couponToPromo);
        setOffers([...STATIC_PROMOS, ...fromApi]);
      } catch {
        if (!cancelled) setOffers(STATIC_PROMOS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { offers, loading };
}
