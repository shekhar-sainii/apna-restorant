import React, { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { Table } from "../../components/common/Table";
import type { Column } from "../../components/common/Table";
import { Input } from "../../components/common/Input";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import couponService from "../../services/couponService";
import type { Coupon } from "../../services/couponService";

export const Coupons: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);

  const [code, setCode] = useState("");
  const [type, setType] = useState<"flat" | "percentage">("flat");
  const [value, setValue] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await couponService.getAll();
      setCoupons(res.data ?? []);
    } catch (err: any) {
      setError(err.message || "Failed to load coupons");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  const openAdd = () => {
    setCode(""); setType("flat"); setValue(""); setMinOrder("");
    setMaxDiscount(""); setUsageLimit(""); setExpiresAt("");
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !value || !expiresAt) return;
    setSaving(true);
    try {
      const payload: any = {
        code: code.toUpperCase(),
        type,
        value: parseFloat(value),
        minOrderAmount: minOrder ? parseFloat(minOrder) : 0,
        expiresAt,
      };
      if (maxDiscount) payload.maxDiscount = parseFloat(maxDiscount);
      if (usageLimit) payload.usageLimit = parseInt(usageLimit);

      const res = await couponService.create(payload);
      setCoupons((prev) => [...prev, res.data]);
      setModalOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to create coupon");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await couponService.delete(deleteTarget._id);
      setCoupons((prev) => prev.filter((c) => c._id !== deleteTarget._id));
    } catch (err: any) {
      alert(err.message || "Failed to delete coupon");
    }
  };

  const handleToggle = async (coupon: Coupon) => {
    try {
      const res = await couponService.update(coupon._id, { isActive: !coupon.isActive });
      setCoupons((prev) => prev.map((c) => c._id === coupon._id ? res.data : c));
    } catch (err: any) {
      alert(err.message || "Failed to update coupon");
    }
  };

  const columns: Column<Coupon>[] = [
    {
      header: "Promo Code",
      accessor: (row) => (
        <code className="bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded font-mono font-bold text-orange-500 text-xs">
          {row.code}
        </code>
      ),
    },
    {
      header: "Discount",
      accessor: (row) => row.type === "flat" ? `₹${row.value}` : `${row.value}%`,
    },
    { header: "Min. Order", accessor: (row) => `₹${row.minOrderAmount}` },
    {
      header: "Expires",
      accessor: (row) => new Date(row.expiresAt).toLocaleDateString("en-IN"),
    },
    {
      header: "Used",
      accessor: (row) => `${row.usedCount}${row.usageLimit ? ` / ${row.usageLimit}` : ""}`,
    },
    {
      header: "Status",
      accessor: (row) => (
        <button onClick={() => handleToggle(row)} className="cursor-pointer">
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${row.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>
            {row.isActive ? "Active" : "Disabled"}
          </span>
        </button>
      ),
    },
    {
      header: "Actions",
      accessor: (row) => (
        <button onClick={() => setDeleteTarget(row)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 transition-all cursor-pointer">
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-200">Discount Coupons</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Manage customer promotional offers</p>
        </div>
        <Button variant="primary" onClick={openAdd} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Coupon
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 text-red-600 text-sm font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <span className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <Table columns={columns} data={coupons} keyExtractor={(c) => c._id} />
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Coupon" size="sm">
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <Input label="Promo Code" type="text" required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. FESTIVE50" />
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Discount Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as any)} className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all">
              <option value="flat">Flat (₹)</option>
              <option value="percentage">Percentage (%)</option>
            </select>
          </div>
          <Input label={type === "flat" ? "Discount Value (₹)" : "Discount (%)"} type="number" required value={value} onChange={(e) => setValue(e.target.value)} placeholder={type === "flat" ? "50" : "20"} />
          {type === "percentage" && (
            <Input label="Max Discount (₹)" type="number" value={maxDiscount} onChange={(e) => setMaxDiscount(e.target.value)} placeholder="100 (optional)" />
          )}
          <Input label="Minimum Order (₹)" type="number" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} placeholder="299 (optional)" />
          <Input label="Usage Limit" type="number" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} placeholder="100 (optional)" />
          <Input label="Expires At" type="date" required value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          <div className="flex gap-3 justify-end pt-1">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="!py-2.5 !px-4 text-xs">Cancel</Button>
            <Button type="submit" variant="primary" loading={saving} className="!py-2.5 !px-4 text-xs">Add Coupon</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Coupon"
        message={`Delete coupon "${deleteTarget?.code}"?`}
        confirmLabel="Delete"
      />
    </div>
  );
};
export default Coupons;
