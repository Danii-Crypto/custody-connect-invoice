import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Download, Edit, RefreshCw, Check, X, Plus, Trash2, Loader2, FileText, Mail } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import ClientSelector from "@/components/ClientSelector";
import AnimatedElement from "./AnimatedElement";
import { base44 } from "@/api/base44Client";
import { sendInvoiceEmail } from "@/functions/sendInvoiceEmail";
import { formatDate, formatCurrency, generateInvoiceNumber, formatFileDate, months } from "@/lib/invoiceUtils";

export default function InvoiceEditor({ profile, invoiceConfig }) {
  const { toast } = useToast();
  const isSingleLine = invoiceConfig.singleLine;
  const invoiceRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const buildDefaults = () => ({
    prefix: invoiceConfig.prefix,
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
    serviceMonth: months[new Date().getMonth()],
    companyName: profile.companyName,
    companyAddr1: profile.companyAddr1,
    companyAddr2: profile.companyAddr2,
    companyPhone: profile.companyPhone,
    logoUrl: profile.logoUrl,
    contactEmail: profile.contactEmail,
    clientEmail: "",
    vesselName: "",
    clientId: "",
    ...(invoiceConfig.defaultClient || {}),
    serviceDescription: invoiceConfig.serviceDescription || "",
    quantity: invoiceConfig.quantity ?? 1,
    unitPrice: invoiceConfig.unitPrice ?? 0,
    lineItems: (invoiceConfig.lineItems || []).map(i => ({ ...i })),
    paymentNotice: invoiceConfig.paymentNotice,
    invoiceNumberOverride: "",
  });

  const [data, setData] = useState(buildDefaults);
  const [temp, setTemp] = useState(buildDefaults);

  const invoiceNum = data.invoiceNumberOverride || generateInvoiceNumber(data.prefix, data.invoiceDate);
  const total = isSingleLine
    ? Number(data.quantity) * Number(data.unitPrice)
    : (data.lineItems || []).reduce((s, i) => s + Number(i.quantity) * Number(i.unitPrice), 0);
  const tempTotal = isSingleLine
    ? Number(temp.quantity) * Number(temp.unitPrice)
    : (temp.lineItems || []).reduce((s, i) => s + Number(i.quantity) * Number(i.unitPrice), 0);

  function openEdit() {
    setTemp({ ...data, lineItems: (data.lineItems || []).map(i => ({ ...i })) });
    setEditOpen(true);
  }
  function applyEdit() {
    setData({ ...temp, lineItems: (temp.lineItems || []).map(i => ({ ...i })) });
    setEditOpen(false);
    toast({ title: "Invoice updated", description: `${invoiceConfig.label} has been updated successfully.` });
  }
  function resetEdit() {
    setTemp(buildDefaults());
  }
  function generateNew() {
    const t = new Date().toISOString().split("T")[0];
    const d = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
    setData(prev => ({ ...prev, invoiceDate: t, dueDate: d, invoiceNumberOverride: "" }));
    toast({ title: "New invoice generated", description: "Dates updated to today." });
  }

  async function handleEmailInvoice() {
    if (!data.clientEmail) {
      toast({ title: "No client email", description: "Add a client email in the edit form first." });
      return;
    }
    setEmailing(true);
    try {
      await sendInvoiceEmail({
        to: data.clientEmail,
        clientName: data.clientName,
        invoiceNumber: invoiceNum,
        invoiceDate: data.invoiceDate,
        dueDate: data.dueDate,
        amount: total,
        companyName: data.companyName,
      });
      toast({ title: "Email sent!", description: `Invoice summary sent to ${data.clientEmail}` });
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || "Could not send email.";
      toast({ title: "Email failed", description: msg });
    }
    setEmailing(false);
  }

  function addLine() {
    setTemp(prev => ({ ...prev, lineItems: [...(prev.lineItems || []), { description: "", quantity: 1, unitPrice: 0 }] }));
  }
  function removeLine(idx) {
    setTemp(prev => ({ ...prev, lineItems: prev.lineItems.filter((_, i) => i !== idx) }));
  }
  function updateLine(idx, field, value) {
    setTemp(prev => ({ ...prev, lineItems: prev.lineItems.map((item, i) => i === idx ? { ...item, [field]: value } : item) }));
  }
  function applyTemplate(templateId) {
    const template = (profile.serviceTemplates || []).find(t => t.id === templateId);
    if (!template) return;
    setTemp(prev => ({ ...prev, lineItems: template.lineItems.map(i => ({ ...i })) }));
    toast({ title: "Template applied", description: `${template.name} loaded — adjust quantities and prices as needed.` });
  }

  async function downloadPDF() {
    if (!invoiceRef.current) return;
    setDownloading(true);
    const canvas = await html2canvas(invoiceRef.current, {
      scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false,
      removeContainer: true, scrollX: 0, scrollY: 0, windowWidth: invoiceRef.current.scrollWidth,
    });
    const imgData = canvas.toDataURL("image/png");
    const pageWidthMm = 210, marginMm = 8;
    const contentWidthMm = pageWidthMm - marginMm * 2;
    const imgHeightMm = (canvas.height * contentWidthMm) / canvas.width;
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [pageWidthMm, imgHeightMm + marginMm * 2] });
    pdf.addImage(imgData, "PNG", marginMm, marginMm, contentWidthMm, imgHeightMm);
    const clientName = (data.clientName || "Client").replace(/[/\\?%*:|"<>]/g, "-");
    const dateStr = formatFileDate(data.invoiceDate);
    const fileName = `${invoiceConfig.label.replace(/\s/g, "_")}_${clientName}_${dateStr}.pdf`;
    pdf.save(fileName);

    base44.entities.InvoiceHistory.create({
      client_id: data.clientId || "",
      client_name: data.clientName || "",
      vessel_name: data.vesselName || "",
      invoice_type: invoiceConfig.id,
      invoice_number: invoiceNum,
      invoice_date: data.invoiceDate || "",
      due_date: data.dueDate || "",
      amount: total,
      file_name: fileName,
      status: "pending",
    });
    setDownloading(false);
  }

  return (
    <AnimatedElement delay={100} className="space-y-6">
      {/* Action Buttons */}
      <div className="print-hidden flex flex-wrap gap-3 mb-6 bg-secondary/30 p-4 rounded-xl border border-border/50">
        <Button onClick={openEdit} className="bg-primary text-white hover:bg-primary/90 hover:shadow-lg hover:scale-105 active:scale-95 transition-all shadow-sm">
          <Edit className="h-4 w-4 mr-2" /> Edit {invoiceConfig.label}
        </Button>
        <Button onClick={generateNew} variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white hover:shadow-lg hover:scale-105 active:scale-95 transition-all shadow-sm">
          <RefreshCw className="h-4 w-4 mr-2" /> Generate New
        </Button>
        <Button variant="outline" onClick={downloadPDF} disabled={downloading} className="border-border text-foreground hover:bg-muted hover:shadow-md hover:scale-105 active:scale-95 transition-all shadow-sm">
          {downloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />} Download PDF
        </Button>
        <Button variant="outline" onClick={handleEmailInvoice} disabled={emailing || !data.clientEmail} className="border-accent text-accent hover:bg-accent hover:text-white hover:shadow-md hover:scale-105 active:scale-95 transition-all shadow-sm">
          {emailing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />} Email to Client
        </Button>
      </div>

      {/* Summary Bar */}
      <div className="print-hidden flex flex-wrap gap-6 items-center bg-muted/40 border border-border/50 rounded-xl px-6 py-4 mb-8 text-sm shadow-inner backdrop-blur-sm">
        <div className="flex flex-col"><span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Invoice #</span><span className="text-foreground font-medium">{invoiceNum}</span></div>
        <div className="w-px h-8 bg-border/80 hidden sm:block" />
        <div className="flex flex-col"><span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Date</span><span className="text-foreground font-medium">{formatDate(data.invoiceDate)}</span></div>
        <div className="w-px h-8 bg-border/80 hidden sm:block" />
        <div className="flex flex-col"><span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Due</span><span className="text-foreground font-medium">{formatDate(data.dueDate)}</span></div>
        <div className="w-px h-8 bg-border/80 hidden sm:block" />
        <div className="flex flex-col"><span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Amount</span><span className="text-primary font-bold text-base">{formatCurrency(total)}</span></div>
      </div>

      {/* Edit Form */}
      {editOpen && (
        <AnimatedElement className="print-hidden border border-border/60 rounded-2xl bg-card shadow-2xl p-6 md:p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-foreground">Edit {invoiceConfig.label}</h3>
            <button onClick={() => setEditOpen(false)} className="text-muted-foreground hover:text-foreground p-2 hover:bg-muted rounded-full transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <ClientSelector onSelect={c => setTemp(p => ({ ...p, clientId: c.id, clientName: c.name, clientAddr1: c.addr1 || "", clientAddr2: c.addr2 || "", clientCountry: c.country || "", clientEmail: c.email || "", vesselName: c.vessel_name || "" }))} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mt-6">
            {/* Invoice Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider pb-2 border-b border-border">Invoice Details</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Prefix</Label>
                  <Input value={temp.prefix} onChange={e => setTemp(p => ({ ...p, prefix: e.target.value }))} className="h-9 text-sm" />
                </div>
                {!isSingleLine && (
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Service Month</Label>
                    <Select value={temp.serviceMonth} onValueChange={val => setTemp(p => ({ ...p, serviceMonth: val }))}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Invoice Date</Label>
                  <Input type="date" value={temp.invoiceDate} onChange={e => setTemp(p => ({ ...p, invoiceDate: e.target.value, invoiceNumberOverride: "" }))} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Due Date</Label>
                  <Input type="date" value={temp.dueDate} onChange={e => setTemp(p => ({ ...p, dueDate: e.target.value }))} className="h-9 text-sm" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Invoice Number</Label>
                <Input placeholder={generateInvoiceNumber(temp.prefix, temp.invoiceDate)} value={temp.invoiceNumberOverride || ""} onChange={e => setTemp(p => ({ ...p, invoiceNumberOverride: e.target.value }))} className="h-9 text-sm" />
                <p className="text-xs text-muted-foreground mt-1">Leave blank to auto-generate</p>
              </div>
            </div>

            {/* Company */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider pb-2 border-b border-border">Company</h4>
              <div className="flex items-center gap-3">
                {temp.logoUrl ? (
                  <img src={temp.logoUrl} alt="Logo" className="h-12 w-auto object-contain max-w-[80px] shrink-0 rounded" onError={e => { e.target.style.display = 'none'; }} />
                ) : (
                  <div className="h-12 w-20 flex items-center justify-center text-xs text-muted-foreground/50 border border-dashed border-border rounded shrink-0">No logo</div>
                )}
                <Input value={temp.logoUrl} onChange={e => setTemp(p => ({ ...p, logoUrl: e.target.value }))} className="h-9 text-sm flex-1" placeholder="Logo URL…" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Company Name</Label>
                <Input value={temp.companyName} onChange={e => setTemp(p => ({ ...p, companyName: e.target.value }))} className="h-9 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Address 1</Label>
                  <Input value={temp.companyAddr1} onChange={e => setTemp(p => ({ ...p, companyAddr1: e.target.value }))} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Address 2</Label>
                  <Input value={temp.companyAddr2} onChange={e => setTemp(p => ({ ...p, companyAddr2: e.target.value }))} className="h-9 text-sm" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Phone</Label>
                <Input value={temp.companyPhone} onChange={e => setTemp(p => ({ ...p, companyPhone: e.target.value }))} className="h-9 text-sm" />
              </div>
            </div>

            {/* Bill To */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider pb-2 border-b border-border">Bill To</h4>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Owner Name</Label>
                <Input value={temp.clientName} onChange={e => setTemp(p => ({ ...p, clientName: e.target.value }))} className="h-9 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Vessel Name</Label>
                  <Input value={temp.vesselName} onChange={e => setTemp(p => ({ ...p, vesselName: e.target.value }))} className="h-9 text-sm" placeholder="e.g. SS Sea Breeze" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Country</Label>
                  <Input value={temp.clientCountry} onChange={e => setTemp(p => ({ ...p, clientCountry: e.target.value }))} className="h-9 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Address 1</Label>
                  <Input value={temp.clientAddr1} onChange={e => setTemp(p => ({ ...p, clientAddr1: e.target.value }))} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Address 2</Label>
                  <Input value={temp.clientAddr2} onChange={e => setTemp(p => ({ ...p, clientAddr2: e.target.value }))} className="h-9 text-sm" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Email</Label>
                <Input type="email" value={temp.clientEmail} onChange={e => setTemp(p => ({ ...p, clientEmail: e.target.value }))} className="h-9 text-sm" placeholder="owner@example.com" />
              </div>
            </div>

            {/* Service Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider pb-2 border-b border-border">Service Details</h4>
              {isSingleLine ? (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Service Description</Label>
                    <Input value={temp.serviceDescription} onChange={e => setTemp(p => ({ ...p, serviceDescription: e.target.value }))} className="h-9 text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Quantity</Label>
                      <Input type="number" value={temp.quantity} onChange={e => setTemp(p => ({ ...p, quantity: e.target.value }))} className="h-9 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Unit Price ($)</Label>
                      <Input type="number" value={temp.unitPrice} onChange={e => setTemp(p => ({ ...p, unitPrice: e.target.value }))} className="h-9 text-sm" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {(profile.serviceTemplates || []).length > 0 && (
                    <Select onValueChange={val => applyTemplate(val)}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Apply a service template…" /></SelectTrigger>
                      <SelectContent>
                        {(profile.serviceTemplates || []).map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                  <div className="flex items-center gap-2 px-1 text-xs font-semibold text-muted-foreground">
                    <div className="flex-1 min-w-0">Description</div>
                    <div className="w-12 text-center shrink-0">Qty</div>
                    <div className="w-32 text-right shrink-0">Price ($)</div>
                    <div className="w-24 text-right shrink-0">Total</div>
                    <div className="w-7 shrink-0" />
                  </div>
                  {(temp.lineItems || []).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 py-1 border-b border-border/40 last:border-0">
                      <Input placeholder="Service description" value={item.description} onChange={e => updateLine(idx, "description", e.target.value)} className="flex-1 h-9 text-sm min-w-0" />
                      <Input type="number" value={item.quantity} onChange={e => updateLine(idx, "quantity", e.target.value)} className="w-12 h-9 text-sm text-center shrink-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                      <Input type="number" value={item.unitPrice} onChange={e => updateLine(idx, "unitPrice", e.target.value)} className="w-32 h-9 text-sm text-right shrink-0 pr-2 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                      <div className="w-24 text-right text-sm font-bold text-foreground py-1 shrink-0">{formatCurrency(Number(item.quantity) * Number(item.unitPrice))}</div>
                      <button type="button" onClick={() => removeLine(idx)} className="w-7 flex items-center justify-center h-9 text-destructive hover:bg-destructive/10 rounded transition-colors shrink-0">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2">
                    <Button type="button" variant="outline" size="sm" onClick={addLine} className="border-primary text-primary hover:bg-primary/10">
                      <Plus className="h-4 w-4 mr-1.5" /> Add Item
                    </Button>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-muted-foreground">Total:</span>
                      <span className="text-lg font-black text-primary">{formatCurrency(tempTotal)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment & Contact */}
          <div className="space-y-3 mt-6 pt-6 border-t border-border">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider pb-2 border-b border-border">Payment &amp; Contact</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Payment Notice</Label>
                <Textarea value={temp.paymentNotice} onChange={e => setTemp(p => ({ ...p, paymentNotice: e.target.value }))} className="text-sm min-h-[100px] resize-none" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Contact Email</Label>
                <Input type="email" value={temp.contactEmail} onChange={e => setTemp(p => ({ ...p, contactEmail: e.target.value }))} className="h-9 text-sm" />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-border">
            <Button onClick={applyEdit} className="bg-primary text-white hover:bg-primary/90">
              <Check className="h-4 w-4 mr-2" /> Apply Changes
            </Button>
            <Button onClick={resetEdit} variant="outline" className="border-border hover:bg-muted">
              <RefreshCw className="h-4 w-4 mr-2" /> Reset
            </Button>
          </div>
        </AnimatedElement>
      )}

      {/* Preview */}
      <AnimatedElement delay={200} className="flex justify-center print-full-page">
        <div ref={invoiceRef} className="w-full max-w-[850px] border-2 border-primary bg-card shadow-2xl print:shadow-none print:border-none mx-auto print:max-w-none print:w-full">
          {/* Header */}
          <div className="flex justify-between items-start p-10 pb-6 border-b border-border print:p-0 print:pb-6 print:pt-4">
            <div className="flex flex-col items-start gap-4">
              <img src={data.logoUrl} alt="Company Logo" className="h-36 w-auto object-contain max-w-[450px]" onError={e => { e.target.style.display = 'none'; }} />
              <div>
                <div className="font-bold text-sm text-foreground uppercase tracking-wide mb-1">{data.companyName}</div>
                <div className="text-xs text-muted-foreground leading-relaxed font-medium">
                  {data.companyAddr1 && <>{data.companyAddr1}<br /></>}
                  {data.companyAddr2 && <>{data.companyAddr2}<br /></>}
                  {data.companyPhone}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-foreground mb-4 uppercase tracking-widest border-b-2 border-primary/20 pb-2 inline-block">
                {invoiceConfig.title || invoiceConfig.label}
              </div>
              <div className="space-y-1.5">
                <div className="text-sm text-muted-foreground flex justify-end gap-2"><span>Invoice Number:</span> <span className="font-bold text-foreground">{invoiceNum}</span></div>
                <div className="text-sm text-muted-foreground flex justify-end gap-2"><span>Date:</span> <span className="font-bold text-foreground">{formatDate(data.invoiceDate)}</span></div>
                <div className="text-sm text-muted-foreground flex justify-end gap-2"><span>Due Date:</span> <span className="font-bold text-foreground">{formatDate(data.dueDate)}</span></div>
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div className="px-10 py-6 print:px-0 print:py-4">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Bill To:</div>
            <div className="text-base font-bold text-foreground mb-1">{data.clientName}</div>
            {data.vesselName && <div className="text-sm text-primary font-semibold mb-1">Vessel: {data.vesselName}</div>}
            <div className="text-sm text-foreground leading-relaxed">
              {data.clientAddr1 && <>{data.clientAddr1}<br /></>}
              {data.clientAddr2 && <>{data.clientAddr2}<br /></>}
              {data.clientCountry}
            </div>
          </div>

          {/* Table */}
          <div className="px-10 pb-8 print:px-0">
            <div className="rounded-xl overflow-hidden border border-primary/20 print:border-none print:rounded-none">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-primary text-primary-foreground print:bg-primary print:text-white">
                    <th className="text-left px-5 py-3 font-semibold w-1/2">Description</th>
                    <th className="text-center px-5 py-3 font-semibold">Quantity</th>
                    <th className="text-right px-5 py-3 font-semibold">Unit Price</th>
                    <th className="text-right px-5 py-3 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {isSingleLine ? (
                    <tr className="border-b border-border bg-card">
                      <td className="px-5 py-4 font-medium text-foreground">{data.serviceDescription}</td>
                      <td className="px-5 py-4 text-center text-foreground font-medium">{data.quantity}</td>
                      <td className="px-5 py-4 text-right text-foreground font-medium">{formatCurrency(data.unitPrice)}</td>
                      <td className="px-5 py-4 text-right text-foreground font-bold">{formatCurrency(Number(data.quantity) * Number(data.unitPrice))}</td>
                    </tr>
                  ) : (
                    (data.lineItems || []).map((item, idx) => (
                      <tr key={idx} className="border-b border-border bg-card last:border-b-0 hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-4 font-medium text-foreground">{item.description}</td>
                        <td className="px-5 py-4 text-center text-foreground font-medium">{item.quantity}</td>
                        <td className="px-5 py-4 text-right text-foreground font-medium">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-5 py-4 text-right text-foreground font-bold">{formatCurrency(Number(item.quantity) * Number(item.unitPrice))}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end mt-6">
              <div className="bg-muted/30 px-6 py-4 rounded-lg border border-border/50 print:border-none print:bg-transparent print:p-0 flex items-center gap-4">
                <span className="text-base font-bold text-muted-foreground uppercase tracking-wider">Total Due:</span>
                <span className="text-2xl font-black text-primary">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Banking Details */}
          {profile.bankDetails && (
            <div className="px-10 py-4 border-t border-border print:px-0">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Payment Details:</div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm text-foreground">
                <div><span className="text-muted-foreground">Bank:</span> {profile.bankDetails.bank}</div>
                <div><span className="text-muted-foreground">Branch:</span> {profile.bankDetails.branch}</div>
                <div><span className="text-muted-foreground">Account Name:</span> {profile.bankDetails.accountName}</div>
                <div><span className="text-muted-foreground">Account Type:</span> {profile.bankDetails.accountType}</div>
                <div className="col-span-2"><span className="text-muted-foreground">Account Number:</span> {profile.bankDetails.accountNumber}</div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-10 py-8 border-t border-border print:px-0 print:pt-4">
            <div className="max-w-2xl space-y-3">
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{data.paymentNotice}</p>
              {data.contactEmail && (
                <p className="text-sm text-foreground">
                  If you have any questions concerning this invoice, please contact{" "}
                  <a href={`mailto:${data.contactEmail}`} className="text-primary hover:underline font-semibold transition-colors">{data.contactEmail}</a>.
                </p>
              )}
              <p className="text-sm font-bold text-foreground pt-1">Thank you for your business,<br /><span className="text-primary">{profile.name}</span></p>
            </div>
          </div>
        </div>
      </AnimatedElement>
    </AnimatedElement>
  );
}