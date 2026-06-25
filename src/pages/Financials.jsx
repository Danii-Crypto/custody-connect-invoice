import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Wallet, Clock, CheckCircle2, Anchor, FileText, Search, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import SummaryCards from "@/components/reports/SummaryCards";
import PaymentDialog from "@/components/invoices/PaymentDialog";
import { formatCurrency, formatDate, calculateAmountPaid } from "@/lib/invoiceUtils";

export default function Financials() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("action");
  const [search, setSearch] = useState("");
  const [paymentInvoice, setPaymentInvoice] = useState(null);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoice-history", "financials"],
    queryFn: () => base44.entities.InvoiceHistory.list("-created_date", 500),
  });

  const stats = useMemo(() => {
    let totalRevenue = 0, collected = 0, outstanding = 0;
    let paidCount = 0, partialCount = 0, pendingCount = 0;
    invoices.forEach(inv => {
      const amt = Number(inv.amount) || 0;
      const paid = inv.amount_paid != null ? Number(inv.amount_paid) : calculateAmountPaid(inv.payments);
      totalRevenue += amt;
      collected += paid;
      outstanding += (amt - paid);
      if (inv.status === "paid") paidCount++;
      else if (inv.status === "partially_paid") partialCount++;
      else pendingCount++;
    });
    return { totalRevenue, collected, outstanding, paidCount, partialCount, pendingCount };
  }, [invoices]);

  const actionRequired = useMemo(
    () => invoices.filter(i => i.status === "pending" || i.status === "partially_paid"),
    [invoices]
  );

  const filteredHistory = useMemo(() => {
    if (!search) return invoices;
    const q = search.toLowerCase();
    return invoices.filter(i =>
      (i.invoice_number || "").toLowerCase().includes(q) ||
      (i.client_name || "").toLowerCase().includes(q) ||
      (i.vessel_name || "").toLowerCase().includes(q)
    );
  }, [invoices, search]);

  async function handleSavePayments(id, updates) {
    await base44.entities.InvoiceHistory.update(id, updates);
    queryClient.invalidateQueries({ queryKey: ["invoice-history"] });
    setPaymentInvoice(null);
  }

  function getStatusBadge(status) {
    if (status === "paid") return { label: "Paid", icon: CheckCircle2, cls: "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700" };
    if (status === "partially_paid") return { label: "Partially Paid", icon: Wallet, cls: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700" };
    return { label: "Pending", icon: Anchor, cls: "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700" };
  }

  function InvoiceRow({ inv }) {
    const badge = getStatusBadge(inv.status);
    const paid = inv.amount_paid != null ? Number(inv.amount_paid) : calculateAmountPaid(inv.payments);
    const remaining = Number(inv.amount) - paid;
    const Icon = badge.icon;
    return (
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60 last:border-0 hover:bg-muted/30 transition-colors">
        <div className="bg-primary/10 p-2 rounded-lg shrink-0">
          <FileText className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-foreground text-sm truncate">{inv.invoice_number}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {inv.client_name}
            {inv.vessel_name && <span className="text-foreground/60"> · {inv.vessel_name}</span>}
          </div>
          {inv.status === "partially_paid" && (
            <div className="text-xs text-blue-600 font-medium mt-0.5">
              {formatCurrency(paid)} paid · {formatCurrency(remaining)} remaining
            </div>
          )}
        </div>
        <div className="hidden sm:block text-xs text-muted-foreground text-right shrink-0">
          <div>Issued: <span className="text-foreground font-medium">{formatDate(inv.invoice_date)}</span></div>
          {inv.due_date && <div>Due: <span className="text-foreground font-medium">{formatDate(inv.due_date)}</span></div>}
        </div>
        <Badge variant="outline" className={`flex items-center gap-1 shrink-0 ${badge.cls}`}>
          <Icon className="h-3 w-3" />
          {badge.label}
        </Badge>
        <div className="font-bold text-primary text-sm shrink-0 w-20 text-right">{formatCurrency(inv.amount)}</div>
        {inv.status !== "paid" && (
          <Button size="sm" variant="outline" onClick={() => setPaymentInvoice(inv)} className="border-accent text-accent hover:bg-accent hover:text-white shrink-0">
            <Wallet className="h-3.5 w-3.5 mr-1" /> Record Payment
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Financials</h1>
            <p className="text-sm text-muted-foreground">Track payments and outstanding balances</p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center text-muted-foreground py-16">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3" />
            <p className="text-sm">Loading financial data…</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center text-muted-foreground py-16 bg-card rounded-xl border border-border">
            <Wallet className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No invoices yet</p>
            <p className="text-sm mt-1">Downloaded invoices will appear here for payment tracking.</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="mb-6">
              <SummaryCards
                totalRevenue={stats.totalRevenue}
                totalInvoices={invoices.length}
                paidAmount={stats.collected}
                pendingAmount={stats.outstanding}
                paidCount={stats.paidCount}
                pendingCount={stats.pendingCount}
                partiallyPaidCount={stats.partialCount}
                clientCount={new Set(invoices.map(i => i.client_name)).size}
              />
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setTab("action")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  tab === "action" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <AlertCircle className="h-4 w-4" />
                Action Required
                {actionRequired.length > 0 && (
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${tab === "action" ? "bg-white/20" : "bg-orange-500/20 text-orange-600"}`}>
                    {actionRequired.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setTab("history")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  tab === "history" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Clock className="h-4 w-4" />
                Full History
              </button>
            </div>

            {/* Content */}
            {tab === "action" ? (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                {actionRequired.length === 0 ? (
                  <div className="text-center py-16">
                    <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-green-500" />
                    <p className="font-medium text-foreground">All caught up!</p>
                    <p className="text-sm text-muted-foreground mt-1">No outstanding or partially paid invoices.</p>
                  </div>
                ) : (
                  actionRequired.map(inv => <InvoiceRow key={inv.id} inv={inv} />)
                )}
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="p-3 border-b border-border">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by invoice #, client, or vessel…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="h-9 pl-9 text-sm"
                    />
                  </div>
                </div>
                {filteredHistory.length === 0 ? (
                  <div className="text-center py-12 text-sm text-muted-foreground">No invoices match your search.</div>
                ) : (
                  filteredHistory.map(inv => <InvoiceRow key={inv.id} inv={inv} />)
                )}
              </div>
            )}
          </>
        )}
      </div>

      {paymentInvoice && (
        <PaymentDialog
          open={!!paymentInvoice}
          onClose={() => setPaymentInvoice(null)}
          invoice={paymentInvoice}
          onSave={handleSavePayments}
        />
      )}
    </div>
  );
}