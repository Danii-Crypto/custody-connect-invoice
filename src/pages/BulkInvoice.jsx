import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Layers, Download, Loader2, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { businessProfiles } from "@/lib/businessProfiles";
import { formatDate, generateInvoiceNumber, formatCurrency, formatFileDate } from "@/lib/invoiceUtils";

const profile = businessProfiles.alessa;
const invoiceConfig = profile.invoiceTypes[0];
const today = new Date().toISOString().split("T")[0];
const dueDefault = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

const defaultShared = {
  prefix: invoiceConfig.prefix,
  invoiceDate: today,
  dueDate: dueDefault,
  companyName: profile.companyName,
  companyAddr1: profile.companyAddr1,
  companyAddr2: profile.companyAddr2,
  companyPhone: profile.companyPhone,
  logoUrl: profile.logoUrl,
  contactEmail: profile.contactEmail,
  paymentNotice: invoiceConfig.paymentNotice,
  lineItems: invoiceConfig.lineItems.map(i => ({ ...i })),
};

const defaultLineItems = invoiceConfig.lineItems.map(i => ({ ...i }));

export default function BulkInvoice() {
  const { toast } = useToast();
  const [shared, setShared] = useState({ ...defaultShared });
  const [selectedClients, setSelectedClients] = useState([]);
  const [clientOverrides, setClientOverrides] = useState({});
  const [expandedClient, setExpandedClient] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const renderRef = useRef(null);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list("-created_date"),
  });

  function toggleClient(c) {
    setSelectedClients(prev =>
      prev.find(x => x.id === c.id) ? prev.filter(x => x.id !== c.id) : [...prev, c]
    );
  }

  function toggleAll() {
    if (selectedClients.length === clients.length) setSelectedClients([]);
    else setSelectedClients([...clients]);
  }

  function getOverride(clientId) {
    return clientOverrides[clientId] || {};
  }
  function setOverride(clientId, patch) {
    setClientOverrides(prev => ({ ...prev, [clientId]: { ...(prev[clientId] || {}), ...patch } }));
  }

  async function generateAll() {
    if (!selectedClients.length) return;
    setGenerating(true);
    setProgress({ current: 0, total: selectedClients.length });

    for (let i = 0; i < selectedClients.length; i++) {
      const client = selectedClients[i];
      const override = getOverride(client.id);
      setProgress({ current: i + 1, total: selectedClients.length });

      const invoiceData = {
        ...shared,
        clientName: client.name,
        vesselName: client.vessel_name || "",
        clientAddr1: client.addr1 || "",
        clientAddr2: client.addr2 || "",
        clientCountry: client.country || "",
        lineItems: override.lineItems || defaultLineItems,
      };

      await renderAndDownload(invoiceData, renderRef);
      await new Promise(r => setTimeout(r, 300));
    }

    setGenerating(false);
    toast({ title: `${selectedClients.length} invoice(s) generated!` });
  }

  return (
    <div className="min-h-screen bg-background">
      <div ref={renderRef} style={{ position: "fixed", left: "-9999px", top: 0, width: "850px", background: "#fff", zIndex: -1 }} />

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Layers className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Fleet Invoicing</h1>
            <p className="text-sm text-muted-foreground">Generate invoices for multiple vessel owners at once</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Shared Settings */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="text-sm font-bold text-foreground mb-4">Invoice Settings</h2>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Invoice Prefix</Label>
                  <Input value={shared.prefix} onChange={e => setShared(p => ({ ...p, prefix: e.target.value }))} className="h-9 text-sm" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Invoice Date</Label>
                    <Input type="date" value={shared.invoiceDate} onChange={e => setShared(p => ({ ...p, invoiceDate: e.target.value }))} className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Due Date</Label>
                    <Input type="date" value={shared.dueDate} onChange={e => setShared(p => ({ ...p, dueDate: e.target.value }))} className="h-9 text-sm" />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Default Line Items</Label>
                  <div className="space-y-2">
                    {shared.lineItems.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-6">
                          {idx === 0 && <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Description</Label>}
                          <Input value={item.description} onChange={e => { const items = [...shared.lineItems]; items[idx] = { ...items[idx], description: e.target.value }; setShared(p => ({ ...p, lineItems: items })); }} className="h-8 text-sm" />
                        </div>
                        <div className="col-span-2">
                          {idx === 0 && <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Qty</Label>}
                          <Input type="number" value={item.quantity} onChange={e => { const items = [...shared.lineItems]; items[idx] = { ...items[idx], quantity: Number(e.target.value) }; setShared(p => ({ ...p, lineItems: items })); }} className="h-8 text-sm text-center" />
                        </div>
                        <div className="col-span-3">
                          {idx === 0 && <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Price ($)</Label>}
                          <Input type="number" value={item.unitPrice} onChange={e => { const items = [...shared.lineItems]; items[idx] = { ...items[idx], unitPrice: Number(e.target.value) }; setShared(p => ({ ...p, lineItems: items })); }} className="h-8 text-sm text-right" />
                        </div>
                        <div className="col-span-1">
                          <button onClick={() => setShared(p => ({ ...p, lineItems: p.lineItems.filter((_, i) => i !== idx) }))} className="h-8 w-8 flex items-center justify-center text-destructive hover:bg-destructive/10 rounded">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => setShared(p => ({ ...p, lineItems: [...p.lineItems, { description: "", quantity: 1, unitPrice: 0 }] }))} className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                      <Plus className="h-3 w-3" /> Add line
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <Button onClick={generateAll} disabled={!selectedClients.length || generating} className="w-full bg-primary text-white hover:bg-primary/90 h-11 text-sm font-semibold">
              {generating ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating {progress.current}/{progress.total}…</>
              ) : (
                <><Download className="h-4 w-4 mr-2" /> Generate {selectedClients.length || ""} PDF{selectedClients.length !== 1 ? "s" : ""}</>
              )}
            </Button>
          </div>

          {/* RIGHT: Client Selection */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-foreground">Select Owners ({selectedClients.length}/{clients.length})</h2>
                <button onClick={toggleAll} className="text-xs text-primary hover:underline font-medium">
                  {selectedClients.length === clients.length && clients.length > 0 ? "Deselect All" : "Select All"}
                </button>
              </div>

              {isLoading ? (
                <div className="text-center text-muted-foreground py-8 text-sm">Loading owners…</div>
              ) : clients.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 text-sm">No owners yet. Add owners on the Vessel Owners page first.</div>
              ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                  {clients.map(c => {
                    const selected = !!selectedClients.find(x => x.id === c.id);
                    const override = getOverride(c.id);
                    const expanded = expandedClient === c.id;
                    return (
                      <div key={c.id} className={`border rounded-lg transition-colors ${selected ? "border-primary/50 bg-primary/5" : "border-border bg-background"}`}>
                        <div className="flex items-center gap-3 px-4 py-3">
                          <input type="checkbox" checked={selected} onChange={() => toggleClient(c)} className="h-4 w-4 cursor-pointer accent-primary" />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-foreground">{c.name}</div>
                            {(c.addr1 || c.addr2) && (
                              <div className="text-xs text-muted-foreground truncate">{[c.addr1, c.addr2].filter(Boolean).join(", ")}</div>
                            )}
                          </div>
                          {selected && (
                            <button onClick={() => setExpandedClient(expanded ? null : c.id)} className="text-muted-foreground hover:text-primary p-1">
                              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                          )}
                        </div>

                        {selected && expanded && (
                          <div className="px-4 pb-4 border-t border-border pt-3 bg-card/50 rounded-b-lg">
                            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Override line items for {c.name}</p>
                            <div className="space-y-2">
                              {(override.lineItems || defaultLineItems).map((item, idx) => (
                                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                                  <div className="col-span-6">
                                    {idx === 0 && <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Description</Label>}
                                    <Input value={item.description} onChange={e => { const items = [...(override.lineItems || defaultLineItems)]; items[idx] = { ...items[idx], description: e.target.value }; setOverride(c.id, { lineItems: items }); }} className="h-8 text-sm" />
                                  </div>
                                  <div className="col-span-2">
                                    {idx === 0 && <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Qty</Label>}
                                    <Input type="number" value={item.quantity} onChange={e => { const items = [...(override.lineItems || defaultLineItems)]; items[idx] = { ...items[idx], quantity: Number(e.target.value) }; setOverride(c.id, { lineItems: items }); }} className="h-8 text-sm text-center" />
                                  </div>
                                  <div className="col-span-3">
                                    {idx === 0 && <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Price ($)</Label>}
                                    <Input type="number" value={item.unitPrice} onChange={e => { const items = [...(override.lineItems || defaultLineItems)]; items[idx] = { ...items[idx], unitPrice: Number(e.target.value) }; setOverride(c.id, { lineItems: items }); }} className="h-8 text-sm text-right" />
                                  </div>
                                  <div className="col-span-1">
                                    <button onClick={() => { const items = (override.lineItems || defaultLineItems).filter((_, i) => i !== idx); setOverride(c.id, { lineItems: items }); }} className="h-8 w-8 flex items-center justify-center text-destructive hover:bg-destructive/10 rounded">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                              <button onClick={() => { const items = [...(override.lineItems || defaultLineItems), { description: "", quantity: 1, unitPrice: 0 }]; setOverride(c.id, { lineItems: items }); }} className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                                <Plus className="h-3 w-3" /> Add line
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

async function renderAndDownload(invoiceData, containerRef) {
  const invoiceNum = generateInvoiceNumber(invoiceData.prefix, invoiceData.invoiceDate);
  const total = (invoiceData.lineItems || []).reduce((s, i) => s + Number(i.quantity) * Number(i.unitPrice), 0);

  const html = buildInvoiceHtml(invoiceData, invoiceNum, total);
  containerRef.current.innerHTML = html;
  await new Promise(r => setTimeout(r, 200));

  const canvas = await html2canvas(containerRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false });
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgHeight = (canvas.height * pageWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;
  pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
  heightLeft -= pageHeight;
  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
    heightLeft -= pageHeight;
  }
  const clientName = (invoiceData.clientName || "Client").replace(/[/\\?%*:|"<>]/g, "-");
  const dateStr = formatFileDate(invoiceData.invoiceDate);
  pdf.save(`Boat_Clinic_Invoice_${clientName}_${dateStr}.pdf`);
  containerRef.current.innerHTML = "";

  base44.entities.InvoiceHistory.create({
    client_name: invoiceData.clientName || "",
    vessel_name: invoiceData.vesselName || "",
    invoice_type: "boatclinic",
    invoice_number: invoiceNum,
    invoice_date: invoiceData.invoiceDate || "",
    due_date: invoiceData.dueDate || "",
    amount: total,
    file_name: `Boat_Clinic_Invoice_${clientName}_${dateStr}.pdf`,
    status: "pending",
    });
}

function buildInvoiceHtml(d, invoiceNum, total) {
  const fc = (v) => "$" + Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fd = formatDate;
  const primaryColor = "#1565c0";
  const rowsBg = "#f8fafc";

  const bankHtml = profile.bankDetails ? `
    <div style="margin-top:16px;padding-top:16px;border-top:1px solid #e2e8f0">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-bottom:8px">Payment Details:</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 32px;font-size:13px;color:#111">
        <div><span style="color:#64748b">Bank:</span> ${profile.bankDetails.bank}</div>
        <div><span style="color:#64748b">Branch:</span> ${profile.bankDetails.branch}</div>
        <div><span style="color:#64748b">Account Name:</span> ${profile.bankDetails.accountName}</div>
        <div><span style="color:#64748b">Account Type:</span> ${profile.bankDetails.accountType}</div>
        <div style="grid-column:1/3"><span style="color:#64748b">Account Number:</span> ${profile.bankDetails.accountNumber}</div>
      </div>
    </div>` : "";

  const tableRows = (d.lineItems || []).map((item, i) => `
    <tr style="background:${i % 2 === 0 ? rowsBg : "#fff"}">
      <td style="padding:12px 16px;font-weight:500">${item.description}</td>
      <td style="padding:12px 16px;text-align:center">${item.quantity}</td>
      <td style="padding:12px 16px;text-align:right">${fc(item.unitPrice)}</td>
      <td style="padding:12px 16px;text-align:right;font-weight:700">${fc(Number(item.quantity) * Number(item.unitPrice))}</td>
    </tr>`).join("");

  return `
    <div style="font-family:Inter,Arial,sans-serif;font-size:14px;color:#111;background:#fff;padding:40px;width:850px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid #e2e8f0;padding-bottom:24px;margin-bottom:24px">
        <div>
          <img src="${d.logoUrl}" alt="Alessa's Boat Clinic" style="height:96px;margin-bottom:12px" />
          <div style="font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:1px">${d.companyName}</div>
          <div style="font-size:12px;color:#64748b;line-height:1.6;margin-top:4px">${d.companyAddr1}${d.companyAddr1 ? "<br/>" : ""}${d.companyAddr2}<br/>${d.companyPhone}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:22px;font-weight:900;text-transform:uppercase;letter-spacing:2px;border-bottom:2px solid #e2e8f0;padding-bottom:8px;margin-bottom:12px">Boat Clinic Invoice</div>
          <div style="font-size:13px;color:#64748b;margin-bottom:4px">Invoice Number: <strong style="color:#111">${invoiceNum}</strong></div>
          <div style="font-size:13px;color:#64748b;margin-bottom:4px">Date: <strong style="color:#111">${fd(d.invoiceDate)}</strong></div>
          <div style="font-size:13px;color:#64748b">Due Date: <strong style="color:#111">${fd(d.dueDate)}</strong></div>
        </div>
      </div>
      <div style="margin-bottom:24px">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-bottom:8px">Bill To:</div>
        <div style="font-weight:700;font-size:15px">${d.clientName}</div>
        ${d.vesselName ? `<div style="font-size:13px;color:${primaryColor};font-weight:600;margin-top:4px">Vessel: ${d.vesselName}</div>` : ""}
        <div style="font-size:13px;line-height:1.6;margin-top:4px">${d.clientAddr1}${d.clientAddr1 ? "<br/>" : ""}${d.clientAddr2}<br/>${d.clientCountry}</div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:13px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
        <thead>
          <tr style="background:${primaryColor};color:#fff">
            <th style="text-align:left;padding:12px 16px;font-weight:600;width:50%">Description</th>
            <th style="text-align:center;padding:12px 16px;font-weight:600">Quantity</th>
            <th style="text-align:right;padding:12px 16px;font-weight:600">Unit Price</th>
            <th style="text-align:right;padding:12px 16px;font-weight:600">Total</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
      <div style="display:flex;justify-content:flex-end;margin-top:20px">
        <div style="padding:12px 24px;border:1px solid #e2e8f0;border-radius:8px;display:flex;align-items:center;gap:16px">
          <span style="font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748b;font-size:13px">Total Due:</span>
          <span style="font-size:22px;font-weight:900;color:${primaryColor}">${fc(total)}</span>
        </div>
      </div>
      ${bankHtml}
      <div style="margin-top:24px;padding-top:24px;border-top:1px solid #e2e8f0">
        <p style="font-size:13px;line-height:1.6;color:#374151;padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin:0 0 12px;white-space:pre-line">${d.paymentNotice}</p>
        <p style="font-size:13px;font-weight:700;margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0">Thank you for your business,<br/><span style="color:${primaryColor}">Alessa's Boat Clinic</span></p>
      </div>
    </div>`;
}