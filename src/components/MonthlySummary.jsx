import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { FileText, DollarSign } from "lucide-react";

function formatCurrency(val) {
  return "$" + Number(val || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function MonthlySummary() {
  const now = new Date();
  const monthLabel = now.toLocaleString("default", { month: "long", year: "numeric" });

  const { data: history = [], isLoading } = useQuery({
    queryKey: ["invoice-history-summary"],
    queryFn: () => base44.entities.InvoiceHistory.list("-created_date"),
  });

  const thisMonthRecords = history.filter(h => {
    if (!h.created_date) return false;
    const d = new Date(h.created_date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  const totalAmount = thisMonthRecords.reduce((sum, h) => sum + Number(h.amount || 0), 0);
  const invoiceCount = thisMonthRecords.length;

  if (isLoading) return null;

  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
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
  );
}