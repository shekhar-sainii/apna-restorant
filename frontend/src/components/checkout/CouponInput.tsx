import React, { useState } from "react";
import { Tag, Loader2, X } from "lucide-react";
import { Button } from "../common/Button";
import couponService, { type AppliedCoupon } from "../../services/couponService";

interface CouponInputProps {
  subtotal: number;
  applied: AppliedCoupon | null;
  onApply: (coupon: AppliedCoupon) => void;
  onRemove: () => void;
}

export const CouponInput: React.FC<CouponInputProps> = ({
  subtotal,
  applied,
  onApply,
  onRemove,
}) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApply = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    try {
      const res = await couponService.apply(trimmed, subtotal);
      onApply(res.data);
      setCode("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid coupon");
    } finally {
      setLoading(false);
    }
  };

  if (applied) {
    return (
      <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-emerald-600" />
          <div>
            <p className="font-bold text-sm text-emerald-800 dark:text-emerald-300">
              {applied.code} applied
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              You save ₹{applied.discountAmount}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 cursor-pointer"
          aria-label="Remove coupon"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleApply())}
            placeholder="Enter coupon code"
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          className="!px-4 shrink-0"
          disabled={loading || !code.trim()}
          onClick={handleApply}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
        </Button>
      </div>
      {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
    </div>
  );
};
