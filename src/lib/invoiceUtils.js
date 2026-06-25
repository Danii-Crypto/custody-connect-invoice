export const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export function formatDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${m}/${d}/${y}`;
}

export function formatCurrency(val) {
  return "$" + Number(val || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function generateInvoiceNumber(prefix, dateStr) {
  const d = new Date(dateStr || Date.now());
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${prefix} - ${dd}${mm}${yyyy}`;
}

export function calculateAmountPaid(payments) {
  if (!payments || !Array.isArray(payments)) return 0;
  return payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
}

export function calculateStatus(total, payments) {
  const paid = calculateAmountPaid(payments);
  if (paid <= 0) return "pending";
  if (paid < total) return "partially_paid";
  return "paid";
}

export function formatFileDate(dateStr) {
  if (!dateStr) {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const yyyy = now.getFullYear();
    return `${mm}.${dd}.${yyyy}`;
  }
  const [y, m, d] = dateStr.split("-");
  return `${m}.${d}.${y}`;
}