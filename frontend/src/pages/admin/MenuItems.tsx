import React, { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, AlertCircle } from "lucide-react";
import { Table } from "../../components/common/Table";
import type { Column } from "../../components/common/Table";
import { Input } from "../../components/common/Input";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import menuService from "../../services/menuService";
import type { MenuItem, Category } from "../../services/menuService";
import fetchApi from "../../services/api";

export const MenuItems: React.FC = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MenuItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isVeg, setIsVeg] = useState(true);
  const [description, setDescription] = useState("");
  const [prepTime, setPrepTime] = useState("15");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [itemRes, catRes] = await Promise.all([
        menuService.getItems({ limit: 100 } as any),
        menuService.getCategories(),
      ]);
      setItems(itemRes.data ?? []);
      setCategories(catRes.data ?? []);
    } catch (err: any) {
      setError(err.message || "Failed to load menu items");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => {
    setEditTarget(null);
    setName(""); setPrice(""); setCategoryId(categories[0]?._id ?? "");
    setIsVeg(true); setDescription(""); setPrepTime("15");
    setModalOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditTarget(item);
    setName(item.name);
    setPrice(String(item.price));
    setCategoryId(typeof item.category === "object" ? item.category._id : item.category);
    setIsVeg(item.isVeg);
    setDescription(item.description);
    setPrepTime(String(item.preparationTime));
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price || !categoryId) return;
    setSaving(true);
    try {
      const payload = { name, price: parseFloat(price), category: categoryId, isVeg, description, preparationTime: parseInt(prepTime) };
      if (editTarget) {
        const res = await fetchApi<{ data: MenuItem }>(`/menu/items/${editTarget._id}`, { method: "PATCH", body: JSON.stringify(payload) });
        setItems((prev) => prev.map((i) => i._id === editTarget._id ? res.data : i));
      } else {
        const res = await fetchApi<{ data: MenuItem }>("/menu/items", { method: "POST", body: JSON.stringify(payload) });
        setItems((prev) => [...prev, res.data]);
      }
      setModalOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to save item");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (item: MenuItem) => {
    try {
      const res = await fetchApi<{ data: MenuItem }>(`/menu/items/${item._id}/toggle`, { method: "PATCH" });
      setItems((prev) => prev.map((i) => i._id === item._id ? res.data : i));
    } catch (err: any) {
      alert(err.message || "Failed to toggle availability");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetchApi(`/menu/items/${deleteTarget._id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((i) => i._id !== deleteTarget._id));
    } catch (err: any) {
      alert(err.message || "Failed to delete item");
    }
  };

  const getCatName = (item: MenuItem) =>
    typeof item.category === "object" ? item.category.name : categories.find((c) => c._id === item.category)?.name ?? "—";

  const columns: Column<MenuItem>[] = [
    {
      header: "Dish",
      accessor: (row) => (
        <div className="flex items-center gap-3">
          {row.image ? (
            <img src={row.image} alt={row.name} className="w-10 h-10 rounded-xl object-cover shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl shrink-0">🍽</div>
          )}
          <div>
            <p className="font-extrabold text-sm">{row.name}</p>
            <p className="text-xs text-slate-400 line-clamp-1">{row.description}</p>
          </div>
        </div>
      ),
    },
    { header: "Category", accessor: (row) => getCatName(row) },
    {
      header: "Type",
      accessor: (row) => (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${row.isVeg ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${row.isVeg ? "bg-emerald-500" : "bg-red-500"}`} />
          {row.isVeg ? "Veg" : "Non-Veg"}
        </span>
      ),
    },
    { header: "Price", accessor: (row) => <span className="font-extrabold text-orange-500">₹{row.price}</span> },
    {
      header: "Available",
      accessor: (row) => (
        <button onClick={() => handleToggle(row)} className="cursor-pointer text-slate-500 hover:text-orange-500 transition-colors">
          {row.isAvailable
            ? <ToggleRight className="w-6 h-6 text-emerald-500" />
            : <ToggleLeft className="w-6 h-6 text-slate-400" />}
        </button>
      ),
    },
    {
      header: "Actions",
      accessor: (row) => (
        <div className="flex gap-2">
          <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-all cursor-pointer">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => setDeleteTarget(row)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 transition-all cursor-pointer">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-200">Menu Catalog</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">All dishes served in the restaurant</p>
        </div>
        <Button variant="primary" onClick={openAdd} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Dish
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
        <Table columns={columns} data={items} keyExtractor={(i) => i._id} />
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? "Edit Dish" : "Add New Dish"} size="2xl">
        <form onSubmit={handleSave} className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input compact label="Dish Name" type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Paneer Tikka" />
            <Input compact label="Price (₹)" type="number" required value={price} onChange={(e) => setPrice(e.target.value)} placeholder="250" />
            <Input compact label="Prep Time (min)" type="number" value={prepTime} onChange={(e) => setPrepTime(e.target.value)} placeholder="15" />
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <Input compact label="Description" type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description" />
          <label className="flex items-center gap-2 cursor-pointer select-none py-1">
            <input type="checkbox" checked={isVeg} onChange={(e) => setIsVeg(e.target.checked)} className="w-4 h-4 accent-orange-500 rounded" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Vegetarian dish</span>
          </label>
          <div className="flex gap-3 justify-end pt-1 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="!py-2 !px-4 text-xs">Cancel</Button>
            <Button type="submit" variant="primary" loading={saving} className="!py-2 !px-4 text-xs">{editTarget ? "Save Changes" : "Add Dish"}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Dish"
        message={`Remove "${deleteTarget?.name}" from the menu?`}
        confirmLabel="Delete"
      />
    </div>
  );
};
export default MenuItems;
