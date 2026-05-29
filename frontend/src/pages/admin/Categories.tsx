import React, { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, AlertCircle } from "lucide-react";
import { Table } from "../../components/common/Table";
import type { Column } from "../../components/common/Table";
import { Input } from "../../components/common/Input";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import menuService from "../../services/menuService";
import type { Category } from "../../services/menuService";

export const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const [name, setName] = useState("");

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await menuService.getCategories();
      setCategories(res.data ?? []);
    } catch (err: any) {
      setError(err.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const openAdd = () => {
    setEditTarget(null);
    setName("");
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditTarget(cat);
    setName(cat.name);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      const token = localStorage.getItem("ar_access_token");
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

      if (editTarget) {
        const res = await fetch(`${API_URL}/menu/categories/${editTarget._id}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
          credentials: "include",
        });
        if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
        const data = await res.json();
        setCategories((prev) => prev.map((c) => c._id === editTarget._id ? data.data : c));
      } else {
        const res = await fetch(`${API_URL}/menu/categories`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
          credentials: "include",
        });
        if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
        const data = await res.json();
        setCategories((prev) => [...prev, data.data]);
      }
      setModalOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const token = localStorage.getItem("ar_access_token");
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
      const res = await fetch(`${API_URL}/menu/categories/${deleteTarget._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      setCategories((prev) => prev.filter((c) => c._id !== deleteTarget._id));
    } catch (err: any) {
      alert(err.message || "Failed to delete category");
    }
  };

  const columns: Column<Category>[] = [
    { header: "Category Name", accessor: "name", className: "font-extrabold" },
    { header: "Slug", accessor: (row) => <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono">{row.slug}</code> },
    {
      header: "Status",
      accessor: (row) => (
        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${row.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>
          {row.isActive ? "Active" : "Disabled"}
        </span>
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
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-200">Menu Categories</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Manage culinary grouping classifications</p>
        </div>
        <Button variant="primary" onClick={openAdd} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Category
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
        <Table columns={columns} data={categories} keyExtractor={(c) => c._id} />
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? "Edit Category" : "Add New Category"} size="sm">
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <Input label="Category Name" type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chinese Starters" />
          <div className="flex gap-3 justify-end pt-1">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="!py-2.5 !px-4 text-xs">Cancel</Button>
            <Button type="submit" variant="primary" loading={saving} className="!py-2.5 !px-4 text-xs">{editTarget ? "Save Changes" : "Add Category"}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        message={`Delete "${deleteTarget?.name}"? All associated menu items will be unlinked.`}
        confirmLabel="Delete"
      />
    </div>
  );
};
export default Categories;
