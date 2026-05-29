import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "../../components/common/Button";
import { useCart, cartKey } from "../../context/CartContext";
import { calculateCartPricing } from "../../utils/pricing";
import { DineInBanner } from "../../components/customer/DineInBanner";
import { isDineInMode } from "../../utils/dineInSession";

export const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem } = useCart();
  const dineIn = isDineInMode();
  const { subtotal, gst, deliveryCharge, total } = calculateCartPricing(items, {
    orderType: dineIn ? "dine-in" : "delivery",
  });

  return (
    <div className="flex flex-col gap-8">
      <DineInBanner />
      <div>
        <h2 className="text-3xl font-black text-slate-800 dark:text-slate-200">Your Cart</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          Review items before placing your order
        </p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-8 shadow-sm">
          <div className="inline-flex p-4 rounded-full bg-slate-100 dark:bg-slate-950 text-slate-400 mb-4">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-200">Cart is Empty</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
            Looks like you haven&apos;t added anything yet.
          </p>
          <Link to="/menu">
            <Button variant="primary" className="mx-auto">
              Explore Menu
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col gap-4">
            {items.map((item) => {
              const key = cartKey(item);
              return (
                <div
                  key={key}
                  className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl">🍲</span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-base text-slate-800 dark:text-slate-200">
                        {item.name}
                        {item.selectedSize && (
                          <span className="text-slate-400 font-semibold text-xs ml-1">
                            ({item.selectedSize})
                          </span>
                        )}
                      </h4>
                      <span className="text-sm font-semibold text-orange-500">₹{item.price}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2.5 border border-slate-200 dark:border-slate-800 rounded-2xl p-1 bg-slate-50 dark:bg-slate-950">
                      <button
                        type="button"
                        onClick={() => updateQuantity(key, -1)}
                        className="p-1.5 hover:bg-white dark:hover:bg-slate-900 rounded-xl transition-all cursor-pointer text-slate-700 dark:text-slate-350"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-slate-700 dark:text-slate-350">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(key, 1)}
                        className="p-1.5 hover:bg-white dark:hover:bg-slate-900 rounded-xl transition-all cursor-pointer text-slate-700 dark:text-slate-350"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(key)}
                      className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm h-fit flex flex-col gap-6">
            <h3 className="font-black text-lg text-slate-850 dark:text-slate-200">Order Summary</h3>

            <div className="flex flex-col gap-3.5 text-sm">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Subtotal</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>GST (5%)</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">₹{gst}</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Delivery Charge</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {deliveryCharge === 0 ? (
                    <span className="text-emerald-500">FREE</span>
                  ) : (
                    `₹${deliveryCharge}`
                  )}
                </span>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800/80 my-2" />

              <div className="flex justify-between text-base font-black">
                <span>Total Amount</span>
                <span className="text-orange-500 text-lg">₹{total}</span>
              </div>
            </div>

            <Button variant="primary" className="w-full" onClick={() => navigate("/checkout")}>
              Proceed to Checkout
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
export default Cart;
