import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { FileText, DollarSign, RefreshCw, Trash2 } from "lucide-react";

function formatCurrency(val) {
  return "$" + Number(val || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function MonthlySummary() {
  const now = new Date();
  const monthLabel = now.toLocaleString("default", { month: "long", year: "numeric" });
  const qc = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [showReset, setShowReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  const { data: history = [], isLoading, isFetching } = useQuery({
    queryKey: ["invoice-history-summary"],
    queryFn: () => base44.entities.InvoiceHistory.list("-created_date"),
  });

  function handleRefresh() {
    qc.invalidateQueries({ queryKey: ["invoice-history-summary"] });
    setShowReset(true);
  }

  async function handleReset() {
    if (!confirm("This will delete all invoice history records for this month. Are you sure?")) return;
    setResetting(true);
    const toDelete = history.filter(h => {
      if (!h.created_date) return false;
      const d = new Date(h.created_date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
    await Promise.all(toDelete.map(h => base44.entities.InvoiceHistory.delete(h.id)));
    qc.invalidateQueries({ queryKey: ["invoice-history-summary"] });
    setResetting(false);
    setShowReset(false);
  }

  const thisMonthRecords = history.filter(h => {
    if (!h.created_date) return false;
    const d = new Date(h.created_date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  const totalAmount = thisMonthRecords.reduce((sum, h) => sum + Number(h.amount || 0), 0);
  const invoiceCount = thisMonthRecords.length;

  if (isLoading) return null;

  return (
    <div className="mb-8">
      <div className="flex justify-end items-center gap-3 mb-3">
        {showReset && isAdmin && (
          <button
            onClick={handleReset}
            disabled={resetting}
            className="flex items-center gap-1.5 text-sm text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            {resetting ? "Resetting..." : "Reset This Month"}
          </button>
        )}
        <button
          onClick={handleRefresh}
          disabled={isFetching}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl px-7 py-6 flex items-center gap-5 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5 transition-all">
          <div className="bg-primary p-4 rounded-2xl shrink-0 shadow-md shadow-primary/20">
            <DollarSign className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Billed This Month</div>
            <div className="text-4xl font-black text-primary leading-none">{formatCurrency(totalAmount)}</div>
            <div className="text-sm text-muted-foreground mt-2 font-medium">{monthLabel}</div>
          </div>
        </div>
        <div className="bg-accent/5 border-2 border-accent/20 rounded-2xl px-7 py-6 flex items-center gap-5 hover:shadow-lg hover:shadow-accent/10 hover:-translate-y-0.5 transition-all">
          <div className="bg-accent p-4 rounded-2xl shrink-0 shadow-md shadow-accent/20">
            <FileText className="h-8 w-8 text-accent-foreground" />
          </div>
          <div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Invoices Generated</div>
            <div className="text-4xl font-black text-accent leading-none">{invoiceCount}</div>
            <div className="text-sm text-muted-foreground mt-2 font-medium">{monthLabel}</div>
          </div>
        </div>
      </div>
    </div>
  );
}