import React, { useState, useEffect } from "react";
import { Input } from "../../components/common/Input";
import { Button } from "../../components/common/Button";
import { Store, Clock, Bell, IndianRupee, Save, AlertCircle } from "lucide-react";
import settingsService from "../../services/settingsService";
import type { RestaurantSettings } from "../../services/settingsService";

const Toggle: React.FC<{ value: boolean; onChange: (v: boolean) => void }> = ({ value, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!value)}
    className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-all duration-300 cursor-pointer ${value ? "bg-orange-500" : "bg-slate-200 dark:bg-slate-800"}`}
  >
    <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${value ? "translate-x-5" : ""}`} />
  </button>
);

export const Settings: React.FC = () => {
  const [form, setForm] = useState<RestaurantSettings>({
    restaurantName: "",
    address: "",
    phone: "",
    openTime: "10:00",
    closeTime: "23:00",
    gstPercent: 5,
    deliveryCharge: 0,
    freeDeliveryAbove: 0,
    autoAcceptOrders: true,
    emailNotifications: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    settingsService.get()
      .then((res) => setForm(res.data))
      .catch((err) => setError(err.message || "Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const set = (key: keyof RestaurantSettings, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await settingsService.update(form);
      setForm(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setError(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-200">Restaurant Settings</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Configure core restaurant profile and preferences</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 text-red-600 text-sm font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* General Info */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
        <h3 className="font-black text-base flex items-center gap-2 text-slate-800 dark:text-slate-200">
          <Store className="w-4 h-4 text-orange-500" /> General Information
        </h3>
        <Input label="Restaurant Name" type="text" value={form.restaurantName} onChange={(e) => set("restaurantName", e.target.value)} placeholder="Your Restaurant Name" />
        <Input label="Address" type="text" value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Street, City, State" />
        <Input label="Contact Phone" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 98765 43210" />
      </div>

      {/* Operating Hours */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
        <h3 className="font-black text-base flex items-center gap-2 text-slate-800 dark:text-slate-200">
          <Clock className="w-4 h-4 text-orange-500" /> Operating Hours
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Opening Time" type="time" value={form.openTime} onChange={(e) => set("openTime", e.target.value)} />
          <Input label="Closing Time" type="time" value={form.closeTime} onChange={(e) => set("closeTime", e.target.value)} />
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
        <h3 className="font-black text-base flex items-center gap-2 text-slate-800 dark:text-slate-200">
          <IndianRupee className="w-4 h-4 text-orange-500" /> Pricing & Charges
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <Input label="GST (%)" type="number" value={String(form.gstPercent)} onChange={(e) => set("gstPercent", parseFloat(e.target.value) || 0)} placeholder="5" />
          <Input label="Delivery Charge (₹)" type="number" value={String(form.deliveryCharge)} onChange={(e) => set("deliveryCharge", parseFloat(e.target.value) || 0)} placeholder="30" />
          <Input label="Free Delivery Above (₹)" type="number" value={String(form.freeDeliveryAbove)} onChange={(e) => set("freeDeliveryAbove", parseFloat(e.target.value) || 0)} placeholder="500" />
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
        <h3 className="font-black text-base flex items-center gap-2 text-slate-800 dark:text-slate-200">
          <Bell className="w-4 h-4 text-orange-500" /> Order Preferences
        </h3>
        {[
          { key: "autoAcceptOrders" as const, label: "Auto-accept incoming orders", sub: "New orders are automatically confirmed without manual approval" },
          { key: "emailNotifications" as const, label: "Email notifications for new orders", sub: "Send an email alert to admin when a new order is placed" },
        ].map((item) => (
          <div key={item.key} className="flex items-start justify-between gap-4">
            <div>
              <p className="font-bold text-sm text-slate-700 dark:text-slate-300">{item.label}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.sub}</p>
            </div>
            <Toggle value={form[item.key] as boolean} onChange={(v) => set(item.key, v)} />
          </div>
        ))}
      </div>

      <Button type="submit" variant="primary" loading={saving} className="w-full sm:w-auto self-start flex items-center gap-2">
        <Save className="w-4 h-4" />
        {saved ? "Settings Saved!" : "Save All Settings"}
      </Button>
    </form>
  );
};
export default Settings;
