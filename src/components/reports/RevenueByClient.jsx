import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatCurrency } from "@/lib/invoiceUtils";

export default function RevenueByClient({ data }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h2 className="text-sm font-bold text-foreground mb-4">Revenue by Client</h2>

      <div className="h-72 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="clientName" tick={{ fontSize: 11 }} className="text-muted-foreground" interval={0} angle={-15} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
            <Bar dataKey="paidAmount" name="Paid" stackId="a" fill="hsl(var(--primary))" />
            <Bar dataKey="pendingAmount" name="Pending" stackId="a" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase tracking-wider">
              <th className="py-2 pr-4 font-semibold">Client</th>
              <th className="py-2 px-4 font-semibold text-right">Invoices</th>
              <th className="py-2 px-4 font-semibold text-right">Paid</th>
              <th className="py-2 px-4 font-semibold text-right">Pending</th>
              <th className="py-2 pl-4 font-semibold text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.map((c, i) => (
              <tr key={i} className="border-b border-border/50 last:border-0">
                <td className="py-3 pr-4 font-medium text-foreground">{c.clientName}</td>
                <td className="py-3 px-4 text-right text-muted-foreground">{c.invoiceCount}</td>
                <td className="py-3 px-4 text-right text-green-600 dark:text-green-400 font-medium">{formatCurrency(c.paidAmount)}</td>
                <td className="py-3 px-4 text-right text-orange-600 dark:text-orange-400 font-medium">{formatCurrency(c.pendingAmount)}</td>
                <td className="py-3 pl-4 text-right font-bold text-primary">{formatCurrency(c.totalAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}