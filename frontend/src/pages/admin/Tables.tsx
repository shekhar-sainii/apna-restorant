import React, { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, QrCode, Download, RefreshCw, AlertCircle } from "lucide-react";
import { Table } from "../../components/common/Table";
import type { Column } from "../../components/common/Table";
import { Input } from "../../components/common/Input";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import tableService, { type DiningTable } from "../../services/tableService";

const STATUS_COLORS: Record<string, string> = {
  available: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300",
  occupied: "bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300",
  reserved: "bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300",
};

/** Best practice: QR encodes short URL with numeric table id — table auto-selected on scan */
const getMenuQrUrl = (tableNumber: number) =>
  `${window.location.origin}/t/${tableNumber}`;

const getQrImageUrl = (tableNumber: number) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(getMenuQrUrl(tableNumber))}`;

const QrModal: React.FC<{ table: DiningTable; onClose: () => void }> = ({ table, onClose }) => {
  const menuUrl = getMenuQrUrl(table.tableNumber);
  const qrUrl = getQrImageUrl(table.tableNumber);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = qrUrl;
    a.download = `table-${table.tableNumber}-qr.png`;
    a.target = "_blank";
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 w-full max-w-sm flex flex-col items-center gap-5">
        <h3 className="font-black text-lg text-slate-800 dark:text-slate-200 w-full text-center">
          QR — {table.label}
        </h3>
        <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <img src={qrUrl} alt={`QR for table ${table.tableNumber}`} className="w-56 h-56" />
        </div>
        <div className="text-center text-sm">
          <p className="text-slate-500">Customer scans → menu opens with table locked</p>
          <p className="font-mono text-[10px] text-slate-400 mt-2 break-all">{menuUrl}</p>
        </div>
        <div className="flex gap-3 w-full">
          <Button variant="outline" onClick={onClose} className="flex-1 !py-2.5 text-xs">
            Close
          </Button>
          <Button variant="primary" onClick={handleDownload} className="flex-1 !py-2.5 text-xs flex items-center justify-center gap-1.5">
            <Download className="w-3.5 h-3.5" />
            Download
          </Button>
        </div>
      </div>
    </div>
  );
};

export const Tables: React.FC = () => {
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DiningTable | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DiningTable | null>(null);
  const [qrTable, setQrTable] = useState<DiningTable | null>(null);
  const [saving, setSaving] = useState(false);

  const [tableNumber, setTableNumber] = useState("");
  const [label, setLabel] = useState("");
  const [capacity, setCapacity] = useState("");

  const fetchTables = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await tableService.getAll();
      setTables(res.data ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load tables");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const openAdd = () => {
    setEditTarget(null);
    setTableNumber("");
    setLabel("");
    setCapacity("4");
    setModalOpen(true);
  };

  const openEdit = (t: DiningTable) => {
    setEditTarget(t);
    setTableNumber(String(t.tableNumber));
    setLabel(t.label);
    setCapacity(String(t.capacity));
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(tableNumber, 10);
    const cap = parseInt(capacity, 10);
    if (!label.trim() || Number.isNaN(num) || Number.isNaN(cap)) return;

    setSaving(true);
    setError(null);
    try {
      if (editTarget) {
        await tableService.update(editTarget._id, {
          label: label.trim(),
          capacity: cap,
          tableNumber: num,
        });
      } else {
        await tableService.create({
          tableNumber: num,
          label: label.trim(),
          capacity: cap,
        });
      }
      setModalOpen(false);
      fetchTables();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save table");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await tableService.delete(deleteTarget._id);
      fetchTables();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const cycleStatus = async (table: DiningTable) => {
    const cycle: DiningTable["status"][] = ["available", "occupied", "reserved"];
    const next = cycle[(cycle.indexOf(table.status) + 1) % cycle.length];
    try {
      await tableService.update(table._id, { status: next });
      fetchTables();
    } catch {
      /* ignore */
    }
  };

  const columns: Column<DiningTable>[] = [
    { header: "#", accessor: (row) => row.tableNumber, className: "font-black" },
    { header: "Label", accessor: "label", className: "font-extrabold" },
    { header: "Capacity", accessor: (row) => `${row.capacity} seats` },
    {
      header: "Status",
      accessor: (row) => (
        <button type="button" onClick={() => cycleStatus(row)} className="cursor-pointer">
          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${STATUS_COLORS[row.status]}`}>
            {row.status}
          </span>
        </button>
      ),
    },
    {
      header: "QR Code",
      accessor: (row) => (
        <button
          type="button"
          onClick={() => setQrTable(row)}
          className="inline-flex items-center gap-1.5 text-xs text-orange-500 font-bold hover:underline cursor-pointer"
        >
          <QrCode className="w-3.5 h-3.5" />
          View QR
        </button>
      ),
    },
    {
      header: "Actions",
      accessor: (row) => (
        <div className="flex gap-2">
          <button type="button" onClick={() => openEdit(row)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer">
            <Pencil className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => setDeleteTarget(row)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 cursor-pointer">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-200">Dining Tables</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            QR links use <code className="text-orange-500">/t/5</code> — table auto-selected, no manual pick
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchTables} className="!py-2.5 flex items-center gap-1.5 text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
          <Button variant="primary" onClick={openAdd} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Table
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-50 text-red-600 text-sm font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <Table columns={columns} data={tables} keyExtractor={(t) => t._id} />
      )}

      {qrTable && <QrModal table={qrTable} onClose={() => setQrTable(null)} />}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? "Edit Table" : "Add Table"} size="sm">
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <Input
            label="Table Number (used in QR)"
            type="number"
            required
            min={1}
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            placeholder="5"
          />
          <Input label="Display Label" type="text" required value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Table 5" />
          <Input label="Seating Capacity" type="number" required min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
          <div className="flex gap-3 justify-end pt-1">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={saving}>{editTarget ? "Save" : "Add"}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove Table"
        message={`Remove "${deleteTarget?.label}"?`}
        confirmLabel="Remove"
      />
    </div>
  );
};
export default Tables;
