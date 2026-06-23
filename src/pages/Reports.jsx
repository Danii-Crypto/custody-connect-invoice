import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SummaryCards from "@/components/reports/SummaryCards";
import RevenueByClient from "@/components/reports/RevenueByClient";
import { BarChart3 } from "lucide-react";

export default function Reports() {
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoice-history", "reports"],
    queryFn: () => base44.entities.InvoiceHistory.list("-created_date", 500),
  });

  const byClient = {};
  invoices.forEach(inv => {
    const name = inv.client_name || "Unknown";
    if (!byClient[name]) byClient[name] = { clientName: name, totalAmount: 0, invoiceCount: 0, paidAmount: 0, pendingAmount: 0 };
    const amt = Number(inv.amount) || 0;
    byClient[name].totalAmount += amt;
    byClient[name].invoiceCount += 1;
    if (inv.status === "paid") byClient[name].paidAmount += amt;
    else byClient[name].pendingAmount += amt;
  });
  const clientData = Object.values(byClient).sort((a, b) => b.totalAmount - a.totalAmount);

  const totalRevenue = clientData.reduce((s, c) => s + c.totalAmount, 0);
  const paidAmount = clientData.reduce((s, c) => s + c.paidAmount, 0);
  const pendingAmount = clientData.reduce((s, c) => s + c.pendingAmount, 0);
  const paidCount = invoices.filter(i => i.status === "paid").length;
  const pendingCount = invoices.length - paidCount;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-primary/10 p-2 rounded-lg">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Revenue Dashboard</h1>
            <p className="text-sm text-muted-foreground">Track billing performance by client</p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center text-muted-foreground py-16 text-sm">Loading report data…</div>
        ) : invoices.length === 0 ? (
          <div className="text-center text-muted-foreground py-16 bg-card rounded-xl border border-border">
            <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No invoice data yet</p>
            <p className="text-sm mt-1">Downloaded invoices will appear in your revenue report.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <SummaryCards
              totalRevenue={totalRevenue}
              totalInvoices={invoices.length}
              paidAmount={paidAmount}
              pendingAmount={pendingAmount}
              paidCount={paidCount}
              pendingCount={pendingCount}
              clientCount={clientData.length}
            />
            <RevenueByClient data={clientData} />
          </div>
        )}
      </div>
    </div>
  );
}