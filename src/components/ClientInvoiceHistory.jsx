import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { FileText, Receipt, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return `${m}/${d}/${y}`;
}

function formatCurrency(val) {
  return "$" + Number(val || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ClientInvoiceHistory({ clientId, clientName, showAll = false }) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState(new Set());

  const { data: history = [], isLoading } = useQuery({
    queryKey: ["invoice-history", clientId, clientName, showAll],
    queryFn: async () => {
      const all = await base44.entities.InvoiceHistory.list("-created_date");
      if (showAll) return all;
      return all.filter(h =>
        (clientId && h.client_id === clientId) || h.client_name === clientName
      );
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (ids) => {
      await Promise.all(ids.map(id => base44.entities.InvoiceHistory.delete(id)));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoice-history"] });
      setSelected(new Set());
    },
  });

  function toggleOne(id) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === history.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(history.map(h => h.id)));
    }
  }

  if (isLoading) {
    return <div className="text-center text-muted-foreground py-8">Loading…</div>;
  }

  if (history.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-16 bg-card rounded-xl border border-border">
        <Receipt className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium">No invoices yet</p>
        <p className="text-sm mt-1">{showAll ? "Downloaded invoices will appear here." : "Invoices downloaded for this client will appear here."}</p>
      </div>
    );
  }

  const allChecked = selected.size === history.length;

  return (
    <div>
      {/* Bulk action bar */}
      <div className="flex items-center justify-between mb-3 px-1">
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={allChecked}
            onChange={toggleAll}
            className="h-4 w-4 accent-primary cursor-pointer"
          />
          {selected.size === 0 ? "Select all" : `${selected.size} selected`}
        </label>
        {selected.size > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => deleteMut.mutate(Array.from(selected))}
            disabled={deleteMut.isPending}
            className="h-8 px-3 text-xs"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Delete {selected.size} invoice{selected.size > 1 ? "s" : ""}
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {history.map(h => (
          <div
            key={h.id}
            onClick={() => toggleOne(h.id)}
            className={`bg-card border rounded-xl px-5 py-4 flex items-center justify-between gap-4 cursor-pointer transition-colors ${selected.has(h.id) ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30"}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <input
                type="checkbox"
                checked={selected.has(h.id)}
                onChange={() => toggleOne(h.id)}
                onClick={e => e.stopPropagation()}
                className="h-4 w-4 accent-primary cursor-pointer shrink-0"
              />
              <div className="bg-primary/10 p-2 rounded-lg shrink-0">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-foreground text-sm truncate">{h.invoice_number}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {showAll && h.client_name && <span className="font-medium text-foreground/70">{h.client_name} · </span>}
                  {h.file_name}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 shrink-0 text-right">
              <div className="hidden sm:block text-xs text-muted-foreground">
                <div>Date: <span className="text-foreground font-medium">{formatDate(h.invoice_date)}</span></div>
                {h.due_date && <div>Due: <span className="text-foreground font-medium">{formatDate(h.due_date)}</span></div>}
              </div>
              <Badge variant="outline" className={h.invoice_type === "custody" ? "border-primary text-primary" : "border-accent text-accent"}>
                {h.invoice_type === "custody" ? "Custody" : "Connect"}
              </Badge>
              <div className="font-bold text-primary text-sm">{formatCurrency(h.amount)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}