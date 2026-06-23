import { DollarSign, CheckCircle2, Clock, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/invoiceUtils";

export default function SummaryCards({ totalRevenue, totalInvoices, paidAmount, pendingAmount, paidCount, pendingCount, clientCount }) {
  const cards = [
    { label: "Total Revenue", value: formatCurrency(totalRevenue), sub: `${totalInvoices} invoices`, icon: DollarSign, color: "text-primary", bg: "bg-primary/10" },
    { label: "Collected", value: formatCurrency(paidAmount), sub: `${paidCount} paid`, icon: CheckCircle2, color: "text-green-600 dark:text-green-400", bg: "bg-green-500/10" },
    { label: "Outstanding", value: formatCurrency(pendingAmount), sub: `${pendingCount} pending`, icon: Clock, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-500/10" },
    { label: "Clients Billed", value: clientCount, sub: `${totalInvoices} total invoices`, icon: FileText, color: "text-accent", bg: "bg-accent/10" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div key={i} className="bg-card border border-border rounded-xl p-5">
            <div className={`inline-flex p-2 rounded-lg ${card.bg} mb-3`}>
              <Icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div className="text-2xl font-bold text-foreground">{card.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{card.label} · {card.sub}</div>
          </div>
        );
      })}
    </div>
  );
}