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
    <div className="mb-6">
    <div className="flex justify-end items-center gap-3 mb-2">
      {showReset && isAdmin && (
        <button
          onClick={handleReset}
          disabled={resetting}
          className="flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {resetting ? "Resetting..." : "Reset This Month"}
        </button>
      )}
      <button
        onClick={handleRefresh}
        disabled={isFetching}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
        Refresh
      </button>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-primary/5 border border-primary/20 rounded-xl px-5 py-4 flex items-center gap-4">
        <div className="bg-primary/10 p-2.5 rounded-lg shrink-0">
          <DollarSign className="h-5 w-5 text-primary" />
        </div>
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Billed This Month</div>
          <div className="text-xl font-black text-primary">{formatCurrency(totalAmount)}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{monthLabel}</div>
        </div>
      </div>
      <div className="bg-accent/5 border border-accent/20 rounded-xl px-5 py-4 flex items-center gap-4">
        <div className="bg-accent/10 p-2.5 rounded-lg shrink-0">
          <FileText className="h-5 w-5 text-accent" />
        </div>
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Invoices Generated</div>
          <div className="text-xl font-black text-accent">{invoiceCount}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{monthLabel}</div>
        </div>
      </div>
    </div>
    </div>
  );
}