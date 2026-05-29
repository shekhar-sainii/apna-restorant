import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MapPin,
  CreditCard,
  Check,
  Loader2,
  User,
  Phone,
  LogIn,
} from "lucide-react";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { calculateCartPricing } from "../../utils/pricing";
import userService, { type UserAddress } from "../../services/userService";
import orderService from "../../services/orderService";
import paymentService from "../../services/paymentService";
import { openRazorpayCheckout } from "../../utils/razorpay";
import { getOrCreateGuestSessionId, saveGuestOrder } from "../../utils/guestSession";
import couponService, { type AppliedCoupon } from "../../services/couponService";
import { CouponInput } from "../../components/checkout/CouponInput";
import { consumePendingCoupon } from "../../utils/offers";
import { getDineInSession, clearDineInSession } from "../../utils/dineInSession";
import { DineInBanner } from "../../components/customer/DineInBanner";
import { OrderSummary } from "../../components/checkout/OrderSummary";

const PAYMENT_METHODS = [
  { id: "online" as const, label: "Pay Online", icon: "💳", sub: "UPI, Cards, Net Banking" },
  { id: "cash" as const, label: "Cash on Delivery", icon: "💵", sub: "Pay when order arrives" },
];

function toDeliveryAddress(addr: UserAddress) {
  return {
    line1: addr.line1,
    line2: addr.line2,
    landmark: addr.landmark,
    city: addr.city,
    pincode: addr.pincode,
  };
}

const emptyGuestAddress = {
  line1: "",
  line2: "",
  landmark: "",
  city: "",
  pincode: "",
};

export const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { user, isGuest } = useAuth();
  const { items, clearCart } = useCart();
  const dineIn = getDineInSession();
  const isDineIn = !!dineIn;

  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestAddress, setGuestAddress] = useState(emptyGuestAddress);
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cash">("cash");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [loading, setLoading] = useState(!isGuest);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<{ _id: string; orderNumber: string } | null>(null);

  const pricing = calculateCartPricing(items, {
    couponDiscount: appliedCoupon?.discountAmount,
    orderType: isDineIn ? "dine-in" : "delivery",
  });

  useEffect(() => {
    if (items.length === 0 && !placedOrder) {
      navigate("/cart", { replace: true });
    }
  }, [items.length, navigate, placedOrder]);

  // Auto-apply coupon when user taps an offer from the bottom strip
  useEffect(() => {
    const pending = consumePendingCoupon();
    if (!pending || items.length === 0) return;

    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    couponService
      .apply(pending, subtotal)
      .then((res) => setAppliedCoupon(res.data))
      .catch(() => {
        /* invalid or below min order — user can try manually */
      });
  }, [items]);

  useEffect(() => {
    if (isDineIn || isGuest) {
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await userService.getAddresses();
        const list = res.data ?? [];
        setAddresses(list);
        const defaultAddr = list.find((a) => a.isDefault) ?? list[0];
        if (defaultAddr) setSelectedAddressId(defaultAddr._id);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load addresses");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isGuest, isDineIn]);

  const getDeliveryAddress = () => {
    if (isDineIn) return null;
    if (isGuest) {
      if (!guestAddress.line1.trim() || !guestAddress.city.trim() || !guestAddress.pincode.trim()) {
        return null;
      }
      return {
        line1: guestAddress.line1.trim(),
        line2: guestAddress.line2.trim() || undefined,
        landmark: guestAddress.landmark.trim() || undefined,
        city: guestAddress.city.trim(),
        pincode: guestAddress.pincode.trim(),
      };
    }
    const selected = addresses.find((a) => a._id === selectedAddressId);
    return selected ? toDeliveryAddress(selected) : null;
  };

  const canPlaceOrder = () => {
    if (isDineIn) return true;
    if (isGuest) {
      return (
        guestName.trim().length >= 2 &&
        guestPhone.trim().length >= 10 &&
        guestAddress.line1.trim() &&
        guestAddress.city.trim() &&
        guestAddress.pincode.trim().length >= 6
      );
    }
    return addresses.length > 0 && !!selectedAddressId;
  };

  const finishOrder = (orderId: string, orderNumber: string) => {
    if (isGuest) saveGuestOrder(orderId, orderNumber);
    clearCart();
    setPlacedOrder({ _id: orderId, orderNumber });
  };

  const placeOrder = async () => {
    if (items.length === 0) return;

    if (!isDineIn) {
      const deliveryAddress = getDeliveryAddress();
      if (!deliveryAddress) {
        setError(isGuest ? "Please fill delivery address details" : "Please select a delivery address");
        return;
      }
      if (isGuest && !canPlaceOrder()) {
        setError("Please enter your name, phone, and complete address");
        return;
      }
    }

    setPlacing(true);
    setError(null);

    const orderItems = items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity }));

    try {
      let orderRes;

      if (isDineIn && dineIn) {
        orderRes = await orderService.create({
          items: orderItems,
          orderType: "dine-in",
          tableNumber: dineIn.tableNumber,
          paymentMethod: "cash",
          specialInstructions: specialInstructions.trim() || undefined,
          couponCode: appliedCoupon?.code,
          guestSessionId: getOrCreateGuestSessionId(),
          guestName: guestName.trim() || user?.name || `Table ${dineIn.tableNumber} Guest`,
        });
      } else {
        const deliveryAddress = getDeliveryAddress()!;
        const basePayload = {
          items: orderItems,
          orderType: "delivery" as const,
          deliveryAddress,
          paymentMethod,
          specialInstructions: specialInstructions.trim() || undefined,
          couponCode: appliedCoupon?.code,
        };
        orderRes = await orderService.create(
          isGuest
            ? {
                ...basePayload,
                guestSessionId: getOrCreateGuestSessionId(),
                guestName: guestName.trim(),
                guestPhone: guestPhone.trim(),
              }
            : basePayload
        );
      }

      const order = orderRes.data;

      if (isDineIn) {
        clearDineInSession();
        finishOrder(order._id, order.orderNumber);
        return;
      }

      if (paymentMethod === "online") {
        const payRes = await paymentService.createRazorpayOrder(order._id);
        await openRazorpayCheckout(payRes.data, {
          name: isGuest ? guestName.trim() : (user?.name ?? "Customer"),
          email: user?.email,
          phone: isGuest ? guestPhone.trim() : user?.phone,
          description: `Order ${order.orderNumber}`,
          onSuccess: async (response) => {
            await paymentService.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            finishOrder(order._id, order.orderNumber);
          },
          onDismiss: () => setPlacing(false),
        });
        return;
      }

      finishOrder(order._id, order.orderNumber);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  if (placedOrder) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="inline-flex p-5 rounded-full bg-emerald-500/10 text-emerald-500 mb-6">
          <Check className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-black text-slate-800 dark:text-slate-200 mb-2">Order Placed!</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">
          Your order has been confirmed and is being prepared.
        </p>
        <p className="text-orange-500 font-bold text-lg mb-8">{placedOrder.orderNumber}</p>
        <Button
          variant="primary"
          onClick={() => navigate(`/orders/${placedOrder._id}/track`)}
        >
          Track Your Order
        </Button>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-6 pb-4 md:pb-0">
      <div>
        <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-200">Checkout</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          {isDineIn
            ? "Pay at counter when you're done eating"
            : isGuest
            ? "Guest checkout — no account needed"
            : "Review and confirm your order"}
        </p>
      </div>

      {isDineIn && <DineInBanner />}

      {isGuest && !isDineIn && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-orange-50 dark:bg-orange-500/10 border border-orange-200/60 dark:border-orange-500/20">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Have an account? Login for saved addresses and faster checkout.
          </p>
          <Link to="/login" state={{ from: "/checkout" }}>
            <Button variant="secondary" className="!py-2 !px-4 text-xs flex items-center gap-1.5 w-full sm:w-auto">
              <LogIn className="w-3.5 h-3.5" />
              Login
            </Button>
          </Link>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-semibold">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          {isDineIn && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
              <h3 className="font-black text-base mb-4 text-slate-800 dark:text-slate-200">Your Table</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Ordering for <strong>{dineIn?.tableLabel}</strong> — table was set automatically when you scanned the QR code. No need to select a table.
              </p>
              <Input
                label="Name (optional)"
                className="mt-4"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="For kitchen reference"
                icon={<User className="w-4 h-4" />}
              />
            </div>
          )}

          {/* Guest contact — delivery only */}
          {isGuest && !isDineIn && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
              <h3 className="font-black text-base mb-4 text-slate-800 dark:text-slate-200">
                Your Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  icon={<User className="w-4 h-4" />}
                  placeholder="Rahul Kumar"
                />
                <Input
                  label="Phone Number"
                  type="tel"
                  required
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  icon={<Phone className="w-4 h-4" />}
                  placeholder="9876543210"
                />
              </div>
            </div>
          )}

          {/* Address — delivery only */}
          {!isDineIn && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
            <h3 className="font-black text-base mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <MapPin className="w-4 h-4 text-orange-500" />
              Delivery Address
            </h3>

            {isGuest ? (
              <div className="flex flex-col gap-4">
                <Input
                  label="Address Line 1"
                  required
                  value={guestAddress.line1}
                  onChange={(e) => setGuestAddress((a) => ({ ...a, line1: e.target.value }))}
                  placeholder="Flat, Building, Street"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="City"
                    required
                    value={guestAddress.city}
                    onChange={(e) => setGuestAddress((a) => ({ ...a, city: e.target.value }))}
                    placeholder="Gurgaon"
                  />
                  <Input
                    label="Pincode"
                    required
                    value={guestAddress.pincode}
                    onChange={(e) =>
                      setGuestAddress((a) => ({
                        ...a,
                        pincode: e.target.value.replace(/\D/g, "").slice(0, 6),
                      }))
                    }
                    placeholder="122001"
                  />
                </div>
                <Input
                  label="Area / Line 2 (optional)"
                  value={guestAddress.line2}
                  onChange={(e) => setGuestAddress((a) => ({ ...a, line2: e.target.value }))}
                  placeholder="Sector, Area"
                />
                <Input
                  label="Landmark (optional)"
                  value={guestAddress.landmark}
                  onChange={(e) => setGuestAddress((a) => ({ ...a, landmark: e.target.value }))}
                  placeholder="Near metro station"
                />
              </div>
            ) : loading ? (
              <div className="flex items-center gap-2 text-slate-500 text-sm py-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading addresses...
              </div>
            ) : addresses.length === 0 ? (
              <div className="text-sm text-slate-500">
                <p className="mb-3">No saved addresses. Add one in your profile first.</p>
                <Link to="/profile" className="text-orange-500 font-bold hover:underline">
                  Go to Profile →
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {addresses.map((addr) => (
                  <label
                    key={addr._id}
                    className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedAddressId === addr._id
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-500/5"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      value={addr._id}
                      checked={selectedAddressId === addr._id}
                      onChange={() => setSelectedAddressId(addr._id)}
                      className="mt-0.5 accent-orange-500"
                    />
                    <div>
                      <p className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                        {addr.label}
                        {addr.isDefault && (
                          <span className="ml-2 text-[10px] font-bold text-orange-500 uppercase">
                            Default
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {addr.line1}
                        {addr.line2 ? `, ${addr.line2}` : ""}
                        {addr.landmark ? `, ${addr.landmark}` : ""}, {addr.city} – {addr.pincode}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
          )}

          {/* Coupon */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
            <h3 className="font-black text-base mb-4 text-slate-800 dark:text-slate-200">
              Have a Coupon?
            </h3>
            <CouponInput
              subtotal={pricing.subtotal}
              applied={appliedCoupon}
              onApply={setAppliedCoupon}
              onRemove={() => setAppliedCoupon(null)}
            />
          </div>

          {/* Payment — delivery only (dine-in = pay at counter) */}
          {!isDineIn && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
            <h3 className="font-black text-base mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <CreditCard className="w-4 h-4 text-orange-500" />
              Payment Method
            </h3>
            <div className="flex flex-col gap-3">
              {PAYMENT_METHODS.map((pm) => (
                <label
                  key={pm.id}
                  className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    paymentMethod === pm.id
                      ? "border-orange-500 bg-orange-50 dark:bg-orange-500/5"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={pm.id}
                    checked={paymentMethod === pm.id}
                    onChange={() => setPaymentMethod(pm.id)}
                    className="accent-orange-500"
                  />
                  <span className="text-xl">{pm.icon}</span>
                  <div>
                    <p className="font-extrabold text-sm text-slate-800 dark:text-slate-200">{pm.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{pm.sub}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          )}

          {isDineIn && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20 text-sm text-amber-900 dark:text-amber-200">
              💵 Payment at counter after your meal (cash / UPI at desk)
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Special Instructions (optional)
            </label>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              rows={2}
              placeholder="Less spicy, no onion, etc."
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <OrderSummary
            items={items}
            pricing={pricing}
            appliedCouponCode={appliedCoupon?.code}
          />

          <Button
            variant="primary"
            className="w-full"
            disabled={placing || (!isDineIn && (loading || !canPlaceOrder()))}
            onClick={placeOrder}
          >
            {placing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Placing order...
              </span>
            ) : isDineIn ? (
              `Send to Kitchen · ₹${pricing.total}`
            ) : paymentMethod === "cash" ? (
              `Place Order · ₹${pricing.total}`
            ) : (
              `Pay ₹${pricing.total}`
            )}
          </Button>

          {isGuest && (
            <p className="text-center text-[11px] text-slate-400">
              By placing order you agree to our terms. Guest orders are tracked on this device only.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
export default Checkout;
