import React, { useState, useEffect, useCallback } from "react";
import { Table } from "../../components/common/Table";
import type { Column } from "../../components/common/Table";
import { Button } from "../../components/common/Button";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { AlertCircle } from "lucide-react";
import userService from "../../services/userService";
import type { AdminUser } from "../../services/userService";
import { useAuth } from "../../context/AuthContext";

const ROLE_BADGES: Record<string, string> = {
  admin: "bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300",
  staff: "bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300",
  user: "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300",
};

const ROLES: AdminUser["role"][] = ["user", "staff", "admin"];

export const Users: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggleTarget, setToggleTarget] = useState<AdminUser | null>(null);
  const [roleUpdating, setRoleUpdating] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await userService.getAll();
      setUsers(res.data ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = async () => {
    if (!toggleTarget) return;
    try {
      const res = await userService.toggleStatus(toggleTarget._id, !toggleTarget.isActive);
      setUsers((prev) => prev.map((u) => (u._id === toggleTarget._id ? res.data : u)));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update user status");
    }
  };

  const handleRoleChange = async (userId: string, role: AdminUser["role"]) => {
    setRoleUpdating(userId);
    setError(null);
    try {
      const res = await userService.updateRole(userId, role);
      setUsers((prev) => prev.map((u) => (u._id === userId ? res.data : u)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setRoleUpdating(null);
    }
  };

  const columns: Column<AdminUser>[] = [
    {
      header: "User",
      accessor: (row) => (
        <div>
          <p className="font-extrabold text-sm">{row.name}</p>
          <p className="text-xs text-slate-400">{row.email}</p>
        </div>
      ),
    },
    { header: "Phone", accessor: "phone" },
    {
      header: "Role",
      accessor: (row) => {
        const isSelf = row._id === currentUser?.id;
        return (
          <select
            value={row.role}
            disabled={isSelf || roleUpdating === row._id}
            onChange={(e) => handleRoleChange(row._id, e.target.value as AdminUser["role"])}
            className={`text-xs font-bold capitalize px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer focus:ring-2 focus:ring-orange-500 ${ROLE_BADGES[row.role] ?? ""} ${isSelf ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        );
      },
    },
    {
      header: "Status",
      accessor: (row) => (
        <span
          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${row.isActive ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}
        >
          {row.isActive ? "Active" : "Suspended"}
        </span>
      ),
    },
    {
      header: "Joined",
      accessor: (row) => new Date(row.createdAt).toLocaleDateString("en-IN"),
    },
    {
      header: "Actions",
      accessor: (row) => (
        <Button
          onClick={() => setToggleTarget(row)}
          variant={row.isActive ? "outline" : "secondary"}
          className="!px-3 !py-1.5 text-xs"
          disabled={row._id === currentUser?.id}
        >
          {row.isActive ? "Suspend" : "Activate"}
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-200">User Accounts</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          Change roles (user / staff / admin) and manage access
        </p>
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
        <Table columns={columns} data={users} keyExtractor={(u) => u._id} />
      )}

      <ConfirmDialog
        isOpen={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleToggleStatus}
        title={toggleTarget?.isActive ? "Suspend User" : "Activate User"}
        message={`${toggleTarget?.isActive ? "Suspend" : "Activate"} account for "${toggleTarget?.name}"?`}
        confirmLabel={toggleTarget?.isActive ? "Suspend" : "Activate"}
        variant={toggleTarget?.isActive ? "danger" : "primary"}
      />
    </div>
  );
};
export default Users;
