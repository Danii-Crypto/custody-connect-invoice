import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { FileText, Receipt, Download, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import JSZip from "jszip";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return `${m}/${d}/${y}`;
}

function formatCurrency(val) {
  return "$" + Number(val || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Renders a minimal invoice HTML string into a hidden div, captures it as PDF bytes
async function generatePdfBytes(invoice) {
  const container = document.createElement("div");
  container.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:850px;background:white;font-family:Arial,sans-serif;padding:40px;";

  const formatD = (s) => {
    if (!s) return "—";
    const [y, m, d] = s.split("-");
    return `${m}/${d}/${y}`;
  };
  const fmtCur = (v) => "$" + Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  container.innerHTML = `
    <div style="border-bottom:2px solid #0095ff;padding-bottom:20px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <div style="font-weight:bold;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">sFOX Inc &amp; affiliates</div>
        <div style="font-size:11px;color:#555;line-height:1.6;">
          1712 Pioneer Avenue Suite 135<br/>Cheyenne, WY 82001<br/>(424) 277-0535
        </div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:22px;font-weight:900;text-transform:uppercase;letter-spacing:2px;border-bottom:2px solid #ddd;padding-bottom:8px;margin-bottom:10px;">
          ${invoice.invoice_type === "custody" ? "Custody Invoice" : "Connect Invoice"}
        </div>
        <div style="font-size:12px;color:#555;line-height:1.8;">
          <div>Invoice Number: <strong style="color:#000;">${invoice.invoice_number || "—"}</strong></div>
          <div>Date: <strong style="color:#000;">${formatD(invoice.invoice_date)}</strong></div>
          <div>Due Date: <strong style="color:#000;">${formatD(invoice.due_date)}</strong></div>
        </div>
      </div>
    </div>
    <div style="margin-bottom:20px;">
      <div style="font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:6px;">Bill To:</div>
      <div style="font-size:14px;font-weight:bold;">${invoice.client_name || "—"}</div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:20px;">
      <thead>
        <tr style="background:#0095ff;color:white;">
          <th style="text-align:left;padding:10px 14px;">Description</th>
          <th style="text-align:right;padding:10px 14px;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:12px 14px;">${invoice.invoice_type === "custody" ? "Custody Fee" : "Connect Partner Services"}</td>
          <td style="padding:12px 14px;text-align:right;font-weight:bold;">${fmtCur(invoice.amount)}</td>
        </tr>
      </tbody>
    </table>
    <div style="display:flex;justify-content:flex-end;margin-bottom:24px;">
      <div style="background:#f5f5f5;padding:12px 20px;border-radius:6px;display:flex;gap:16px;align-items:center;">
        <span style="font-weight:bold;text-transform:uppercase;font-size:12px;color:#555;">Total Due:</span>
        <span style="font-size:22px;font-weight:900;color:#0095ff;">${fmtCur(invoice.amount)}</span>
      </div>
    </div>
    <div style="border-top:1px solid #eee;padding-top:16px;font-size:11px;color:#666;">
      <p>Your sFOX account will be charged by the due date. Please ensure there are sufficient funds available.</p>
      <p style="margin-top:8px;font-weight:bold;color:#000;">Thank you for your business, <span style="color:#0095ff;">sFOX</span></p>
    </div>
  `;

  document.body.appendChild(container);

  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  });

  document.body.removeChild(container);

  const imgData = canvas.toDataURL("image/png");
  const pageW = 210;
  const pageH = (canvas.height * pageW) / canvas.width;
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [pageW, pageH] });
  pdf.addImage(imgData, "PNG", 0, 0, pageW, pageH);

  return pdf.output("arraybuffer");
}

export default function ClientInvoiceHistory({ clientId, clientName, showAll = false }) {
  const [selected, setSelected] = useState(new Set());
  const [zipping, setZipping] = useState(false);

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

  async function handleDownloadZip() {
    const toDownload = history.filter(h => selected.has(h.id));
    if (!toDownload.length) return;
    setZipping(true);

    const zip = new JSZip();
    for (const invoice of toDownload) {
      const pdfBytes = await generatePdfBytes(invoice);
      const fileName = invoice.file_name || `${invoice.invoice_number || invoice.id}.pdf`;
      zip.file(fileName, pdfBytes);
    }

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoices_${new Date().toISOString().slice(0, 10)}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    setZipping(false);
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
  const someChecked = selected.size > 0 && !allChecked;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3 px-1">
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={allChecked}
            ref={el => { if (el) el.indeterminate = someChecked; }}
            onChange={toggleAll}
            className="h-4 w-4 accent-primary cursor-pointer"
          />
          {selected.size > 0 ? `${selected.size} selected` : "Select all"}
        </label>

        {selected.size > 0 && (
          <Button
            size="sm"
            onClick={handleDownloadZip}
            disabled={zipping}
            className="bg-primary text-white hover:bg-primary/90 h-8"
          >
            {zipping
              ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Zipping…</>
              : <><Download className="h-3.5 w-3.5 mr-1.5" /> Download ZIP ({selected.size})</>
            }
          </Button>
        )}
      </div>

      {/* Invoice List */}
      <div className="space-y-3">
        {history.map(h => (
          <div
            key={h.id}
            onClick={() => toggleOne(h.id)}
            className={`bg-card border rounded-xl px-5 py-4 flex items-center gap-4 cursor-pointer transition-colors hover:border-primary/30 ${selected.has(h.id) ? "border-primary/60 bg-primary/5" : "border-border"}`}
          >
            <input
              type="checkbox"
              checked={selected.has(h.id)}
              onChange={() => toggleOne(h.id)}
              onClick={e => e.stopPropagation()}
              className="h-4 w-4 accent-primary cursor-pointer shrink-0"
            />
            <div className="flex items-center gap-3 min-w-0 flex-1">
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