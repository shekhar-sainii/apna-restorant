import React, { useState, useEffect, useCallback } from "react";
import { Search, Star, ShoppingCart, RefreshCw, Check } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "../../components/common/Button";
import menuService from "../../services/menuService";
import type { MenuItem, Category } from "../../services/menuService";
import { useCart } from "../../context/CartContext";
import { DineInBanner } from "../../components/customer/DineInBanner";
import tableService from "../../services/tableService";
import { setDineInSession, parseTableFromQuery } from "../../utils/dineInSession";

const SkeletonCard = () => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl overflow-hidden animate-pulse">
    <div className="h-44 bg-slate-200 dark:bg-slate-800" />
    <div className="p-5 flex flex-col gap-3">
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-xl w-3/4" />
      <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl w-full" />
      <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl w-2/3" />
    </div>
    <div className="p-5 pt-0 flex justify-between items-center border-t border-slate-100 dark:border-slate-800/50">
      <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      <div className="h-9 w-28 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
    </div>
  </div>
);

// Per-card size selector state
const MenuItemCard: React.FC<{ item: MenuItem }> = ({ item }) => {
  const { addItem } = useCart();
  const hasSizes = item.sizes && item.sizes.length > 0;
  const [selectedSize, setSelectedSize] = useState(hasSizes ? item.sizes[0].label : null);
  const [added, setAdded] = useState(false);

  const activePrice = hasSizes
    ? (item.sizes.find((s) => s.label === selectedSize)?.price ?? item.price)
    : item.price;

  const handleAddToCart = () => {
    addItem({
      menuItemId: item._id,
      name: item.name,
      price: activePrice,
      image: item.image ?? undefined,
      isVeg: item.isVeg,
      selectedSize: selectedSize ?? undefined,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="group bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
      {/* Image */}
      <div className="h-44 overflow-hidden relative bg-slate-100 dark:bg-slate-950">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🍽</div>
        )}
        {/* Veg badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/95 dark:bg-slate-950/95 text-[10px] font-extrabold shadow border border-slate-200/60 dark:border-slate-800">
          <span className={`w-2 h-2 rounded-full ${item.isVeg ? "bg-emerald-500" : "bg-red-500"}`} />
          {item.isVeg ? "VEG" : "NON-VEG"}
        </div>
        {/* Rating badge */}
        {item.rating.count > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/90 dark:bg-slate-950/90 text-xs font-extrabold shadow">
            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
            {item.rating.average.toFixed(1)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex-1">
        <h4 className="font-extrabold text-base group-hover:text-orange-500 transition-colors text-slate-800 dark:text-slate-200">
          {item.name}
        </h4>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 leading-relaxed line-clamp-2">
          {item.description}
        </p>
        {item.preparationTime > 0 && (
          <p className="text-[10px] text-slate-400 font-semibold mt-2">⏱ {item.preparationTime} min prep</p>
        )}

        {/* Size picker */}
        {hasSizes && (
          <div className="mt-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Size</p>
            <div className="flex flex-wrap gap-1.5">
              {item.sizes.map((s) => (
                <button
                  key={s.label}
                  onClick={() => setSelectedSize(s.label)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                    selectedSize === s.label
                      ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                      : "bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-orange-300"
                  }`}
                >
                  {s.label}
                  <span className="ml-1 opacity-70">₹{s.price}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-5 pt-0 flex justify-between items-center border-t border-slate-100 dark:border-slate-800/50">
        <div>
          <span className="text-[10px] text-slate-400 font-semibold block">Price</span>
          <span className="font-black text-xl text-orange-500">₹{activePrice}</span>
        </div>
        <Button
          variant="primary"
          className="!px-4 !py-2.5 text-xs font-bold"
          onClick={handleAddToCart}
        >
          {added ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Added
            </>
          ) : (
            <>
              <ShoppingCart className="w-3.5 h-3.5" />
              Add to Cart
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export const Menu: React.FC = () => {
  const { itemCount } = useCart();
  const [searchParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [catRes, itemRes] = await Promise.all([
        menuService.getCategories(),
        menuService.getItems(),
      ]);
      setCategories(catRes.data ?? []);
      setItems(itemRes.data ?? []);
    } catch (err: any) {
      setError(err.message || "Failed to load menu. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // QR link: /menu?table=5 — auto-bind table (no manual selection)
  useEffect(() => {
    const tableNum = parseTableFromQuery(searchParams.get("table"));
    if (!tableNum) return;
    tableService
      .getByNumber(tableNum)
      .then((res) => {
        setDineInSession({
          tableNumber: res.data.tableNumber,
          tableLabel: res.data.label,
          status: res.data.status,
        });
      })
      .catch(() => {
        /* invalid table in URL */
      });
  }, [searchParams]);

  const filteredItems = items.filter((item) => {
    const catId = typeof item.category === "object" ? item.category._id : item.category;
    const activecat = categories.find((c) => c.slug === activeCategory);
    const matchesCat = activeCategory === "all" || catId === activecat?._id;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-8">
      <DineInBanner />
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-slate-200">Our Delicious Menu</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {loading ? "Loading menu..." : `${filteredItems.length} items available`}
          </p>
        </div>
        {itemCount > 0 && (
          <Link to="/cart">
            <Button variant="primary" className="!py-2.5 !px-5 text-sm">
              <ShoppingCart className="w-4 h-4" />
              View Cart ({itemCount})
            </Button>
          </Link>
        )}
      </div>

      {/* Search + Category Filter */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-4 shadow-sm">
        <div className="relative w-full md:max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none opacity-50">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search burger, pizza, shake..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold capitalize transition-all cursor-pointer ${
              activeCategory === "all"
                ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                : "bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setActiveCategory(cat.slug)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold capitalize transition-all cursor-pointer ${
                activeCategory === cat.slug
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                  : "bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl">
          <p className="text-red-500 font-bold text-sm">{error}</p>
          <Button variant="outline" onClick={fetchData} className="flex items-center gap-2 !py-2.5 !px-4 text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </Button>
        </div>
      )}

      {/* Grid */}
      {!error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : filteredItems.length === 0
            ? (
              <div className="col-span-full text-center py-16 text-slate-500">
                No items found. Try a different search or category.
              </div>
            )
            : filteredItems.map((item) => <MenuItemCard key={item._id} item={item} />)
          }
        </div>
      )}
    </div>
  );
};
export default Menu;
