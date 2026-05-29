import React, { useEffect, useState } from "react";
import { TrendingUp, ShoppingBag, Users, IndianRupee, RefreshCw, AlertCircle } from "lucide-react";
import analyticsService, { type AnalyticsSummary } from "../../services/analyticsService";

export const Reports: React.FC = () => {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await analyticsService.getSummary();
      setData(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <span className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <p className="text-red-500 font-semibold">{error ?? "No data"}</p>
        <button type="button" onClick={load} className="text-orange-500 font-bold text-sm flex items-center gap-1">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  const stats = [
    { label: "Total Revenue", value: `₹${data.totalRevenue.toLocaleString("en-IN")}`, icon: IndianRupee, color: "from-orange-500 to-amber-500" },
    { label: "Total Orders", value: String(data.totalOrders), icon: ShoppingBag, color: "from-blue-500 to-cyan-500" },
    { label: "Customers", value: String(data.totalUsers), icon: Users, color: "from-purple-500 to-pink-500" },
    { label: "Avg. Order", value: `₹${data.avgOrderValue}`, icon: TrendingUp, color: "from-emerald-500 to-teal-500" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-200">Reports & Analytics</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Live data from your orders</p>
        </div>
        <button type="button" onClick={load} className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 cursor-pointer">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm">
              <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold uppercase text-slate-400">{stat.label}</p>
              <p className="text-2xl font-black mt-1">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
        <h3 className="font-black text-base mb-6">Top Dishes</h3>
        {data.topItems.length === 0 ? (
          <p className="text-sm text-slate-500">No order data yet. Run seed or place test orders.</p>
        ) : (
          <div className="flex flex-col gap-5">
            {data.topItems.map((dish) => (
              <div key={dish.name}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-bold">{dish.name}</span>
                  <span className="text-slate-500">{dish.count} orders · ₹{dish.revenue.toLocaleString("en-IN")}</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: `${dish.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default Reports;
