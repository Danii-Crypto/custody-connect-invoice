import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/invoiceUtils";

export default function PaymentDialog({ open, onClose, invoice, onSave }) {
  const today = new Date().toISOString().split("T")[0];
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(today);
  const [paymentNotes, setPaymentNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const payments = invoice?.payments || [];
  const total = invoice?.amount || 0;
  const paidTotal = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const remaining = total - paidTotal;

  function reset() {
    setPaymentAmount("");
    setPaymentDate(today);
    setPaymentNotes("");
  }

  async function handleAddPayment() {
    const amt = Number(paymentAmount);
    if (!amt || amt <= 0) return;
    setSaving(true);
    const newPayments = [...payments, { date: paymentDate, amount: amt, notes: paymentNotes }];
    const newPaid = paidTotal + amt;
    const newStatus = newPaid <= 0 ? "pending" : newPaid < total ? "partially_paid" : "paid";
    await onSave(invoice.id, {
      payments: newPayments,
      amount_paid: newPaid,
      status: newStatus
    });
    reset();
    setSaving(false);
  }

  async function handleRemovePayment(idx) {
    const newPayments = payments.filter((_, i) => i !== idx);
    const newPaid = newPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
    const newStatus = newPaid <= 0 ? "pending" : newPaid < total ? "partially_paid" : "paid";
    await onSave(invoice.id, {
      payments: newPayments,
      amount_paid: newPaid,
      status: newStatus
    });
  }

  async function handleMarkFullyPaid() {
    const remainingAmt = remaining > 0 ? remaining : 0;
    if (remainingAmt <= 0) return;
    setSaving(true);
    const newPayments = [...payments, { date: today, amount: remainingAmt, notes: "Marked as fully paid" }];
    await onSave(invoice.id, {
      payments: newPayments,
      amount_paid: total,
      status: "paid"
    });
    setSaving(false);
  }

  async function handleMarkPending() {
    setSaving(true);
    await onSave(invoice.id, {
      payments: [],
      amount_paid: 0,
      status: "pending"
    });
    setSaving(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Payment Management</DialogTitle>
          <DialogDescription>
            Invoice {invoice?.invoice_number} — {invoice?.client_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3 bg-muted/40 rounded-lg p-4">
            <div>
              <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Total</div>
              <div className="text-sm font-bold text-foreground mt-1">{formatCurrency(total)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Paid</div>
              <div className="text-sm font-bold text-green-600 mt-1">{formatCurrency(paidTotal)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Remaining</div>
              <div className="text-sm font-bold text-orange-600 mt-1">{formatCurrency(remaining)}</div>
            </div>
          </div>

          {/* Payment History */}
          {payments.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Payment History</div>
              {payments.map((p, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-card border border-border rounded-lg px-3 py-2 text-sm">
                  <div className="flex-1">
                    <div className="font-semibold text-foreground">{formatCurrency(p.amount)}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(p.date)}{p.notes ? ` · ${p.notes}` : ""}</div>
                  </div>
                  <button
                    onClick={() => handleRemovePayment(idx)}
                    className="p-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors"
                    title="Remove payment"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          {remaining > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={handleMarkFullyPaid} disabled={saving} className="border-green-600 text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Mark Fully Paid
              </Button>
            </div>
          )}
          {payments.length > 0 && (
            <Button size="sm" variant="outline" onClick={handleMarkPending} disabled={saving} className="border-orange-600 text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20">
              Reset to Pending
            </Button>
          )}

          {/* Add Payment Form */}
          {remaining > 0 && (
            <div className="space-y-3 pt-4 border-t border-border">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Record Payment</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.00"
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Date</Label>
                  <Input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Notes (optional)</Label>
                <Textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Cash, NCB transfer, deposit…"
                  className="text-sm min-h-[60px] resize-none"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Close</Button>
          {remaining > 0 && (
            <Button onClick={handleAddPayment} disabled={saving || !paymentAmount} className="bg-primary text-white hover:bg-primary/90">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Add Payment
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}