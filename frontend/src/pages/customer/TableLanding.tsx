import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, AlertCircle, Utensils } from "lucide-react";
import tableService from "../../services/tableService";
import { setDineInSession } from "../../utils/dineInSession";
import { Button } from "../../components/common/Button";

/**
 * QR entry point: /t/5 → validates table, locks dine-in session, opens menu.
 * Table is auto-selected — customer never picks table manually after QR scan.
 */
export const TableLanding: React.FC = () => {
  const { tableNumber: tableParam } = useParams<{ tableNumber: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const num = parseInt(tableParam ?? "", 10);
    if (Number.isNaN(num) || num < 1) {
      setError("Invalid table QR code. Please scan the code on your table.");
      return;
    }

    const init = async () => {
      try {
        const res = await tableService.getByNumber(num);
        const table = res.data;
        setDineInSession({
          tableNumber: table.tableNumber,
          tableLabel: table.label,
          status: table.status,
        });
        navigate("/menu", { replace: true });
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "This table is not available. Please ask staff for help."
        );
      }
    };
    init();
  }, [tableParam, navigate]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 gap-4">
        <div className="p-4 rounded-full bg-red-500/10 text-red-500">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-black text-slate-800 dark:text-slate-200">Table Not Found</h2>
        <p className="text-sm text-slate-500 max-w-sm">{error}</p>
        <Button variant="primary" onClick={() => navigate("/menu")}>
          Browse Menu Anyway
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="p-4 rounded-full bg-orange-500/10 text-orange-500">
        <Utensils className="w-10 h-10 animate-pulse" />
      </div>
      <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      <p className="text-sm font-semibold text-slate-500">Setting up your table...</p>
    </div>
  );
};

export default TableLanding;
