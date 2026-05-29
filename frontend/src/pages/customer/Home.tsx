import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Star, ShoppingCart, RefreshCw } from "lucide-react";
import menuService from "../../services/menuService";
import type { MenuItem } from "../../services/menuService";

const SkeletonCard = () => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl overflow-hidden animate-pulse">
    <div className="h-48 bg-slate-200 dark:bg-slate-800" />
    <div className="p-5 flex flex-col gap-3">
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-xl w-3/4" />
      <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl w-full" />
    </div>
    <div className="p-5 pt-0 flex justify-between items-center border-t border-slate-100 dark:border-slate-800/50">
      <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      <div className="h-9 w-28 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
    </div>
  </div>
);

export const Home: React.FC = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await menuService.getItems();
      setItems((res.data ?? []).slice(0, 3));
    } catch (err: any) {
      setError(err.message || "Failed to load menu items.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  return (
    <div className="flex flex-col gap-8">
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-orange-600 to-amber-500 text-white p-8 md:p-12 shadow-xl shadow-orange-500/10">
        <div className="relative z-10 max-w-lg">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider mb-4">
            New Offers Inside 🎉
          </span>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            Delicious food, delivered to your table
          </h2>
          <p className="text-white/80 text-sm md:text-base mt-2">
            Get Flat 20% off on your first order using code{" "}
            <code className="bg-white/20 px-1.5 py-0.5 rounded font-mono font-bold">WELCOME20</code>.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-20 text-9xl select-none hidden lg:block transform translate-x-10 translate-y-10">
          🍕
        </div>
      </div>

      <div>
        <div className="flex justify-between items-end mb-6">
          <div>
            <h3 className="text-2xl font-black">Popular Dishes</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Most loved dishes ordered by our customers</p>
          </div>
          <Link to="/menu" className="text-xs font-bold text-orange-500 hover:underline">View All →</Link>
        </div>

        {error && (
          <div className="flex flex-col items-center justify-center py-16 gap-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl">
            <p className="text-red-500 font-bold text-sm">{error}</p>
            <button onClick={fetchItems} className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-900 transition-all">
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        )}

        {!error && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
              : items.map((item) => (
                  <div key={item._id} className="group bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                    <div className="h-48 overflow-hidden relative bg-slate-100 dark:bg-slate-950">
                      {item.image
                        ? <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                        : <div className="w-full h-full flex items-center justify-center text-6xl">🍲</div>
                      }
                      <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/95 dark:bg-slate-950/95 text-[10px] font-extrabold shadow border border-slate-200/60 dark:border-slate-800">
                        <span className={`w-2 h-2 rounded-full ${item.isVeg ? "bg-emerald-500" : "bg-red-500"}`} />
                        {item.isVeg ? "VEG" : "NON-VEG"}
                      </div>
                      {item.rating.count > 0 && (
                        <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/90 dark:bg-slate-950/90 text-xs font-extrabold shadow">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          {item.rating.average.toFixed(1)}
                        </div>
                      )}
                    </div>
                    <div className="p-5 flex-1">
                      <h4 className="font-extrabold text-lg group-hover:text-orange-500 transition-colors text-slate-800 dark:text-slate-200">{item.name}</h4>
                      <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 leading-relaxed line-clamp-2">{item.description}</p>
                    </div>
                    <div className="p-5 pt-0 flex justify-between items-center border-t border-slate-100 dark:border-slate-800/50 mt-4">
                      <div>
                        <span className="text-xs text-slate-400 font-semibold block">Price</span>
                        <span className="font-black text-xl text-orange-500">₹{item.price}</span>
                      </div>
                      <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-950 hover:bg-slate-900 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 text-xs font-bold shadow-sm transition-all active:scale-[0.98] cursor-pointer">
                        <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
                      </button>
                    </div>
                  </div>
                ))
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
