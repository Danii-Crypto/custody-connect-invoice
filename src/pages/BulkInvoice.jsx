import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Layers, Download, Loader2, Check, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${m}/${d}/${y}`;
}
function generateInvoiceNumber(prefix, dateStr) {
  const d = new Date(dateStr || Date.now());
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${prefix} - ${dd}${mm}${yyyy}`;
}

const today = new Date().toISOString().split("T")[0];
const dueDefault = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

const defaultCustodyShared = {
  prefix: "RD",
  invoiceDate: today,
  dueDate: dueDefault,
  companyAddr1: "1712 Pioneer Avenue Suite 135",
  companyAddr2: "Cheyenne, WY 82001",
  companyPhone: "(424) 277-0535",
  serviceDescription: "Custody Fee",
  quantity: 1,
  unitPrice: 500.00,
  paymentNotice: "Your sFOX account will be charged by the due date. Please ensure there are sufficient funds available to cover the charges.",
  contactEmail: "clientservices@sfox.com",
};

const defaultConnectShared = {
  prefix: "ON",
  invoiceDate: today,
  dueDate: dueDefault,
  serviceMonth: "November",
  companyAddr1: "1712 Pioneer Avenue Suite 135",
  companyAddr2: "Cheyenne, WY 82001",
  companyPhone: "(424) 277-0535",
  paymentNotice: "Your sFOX account will be charged by the due date. Please ensure there are sufficient funds available to cover the charges. Note that if the account lacks the necessary balance for the outstanding amount, this will result in an automatic suspension of access to Connect services.",
  contactEmail: "clientservices@sfox.com",
};

const defaultLineItems = [
  { description: "Monthly Platform Fee", quantity: 1, unitPrice: 10000 },
];

export default function BulkInvoice() {
  const { toast } = useToast();
  const [invoiceType, setInvoiceType] = useState("custody");
  const [sharedCustody, setSharedCustody] = useState({ ...defaultCustodyShared });
  const [sharedConnect, setSharedConnect] = useState({ ...defaultConnectShared });
  const [selectedClients, setSelectedClients] = useState([]);
  const [clientOverrides, setClientOverrides] = useState({}); // id -> { unitPrice } for custody or { lineItems } for connect
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

      // Build invoice data for this client
      let invoiceData;
      if (invoiceType === "custody") {
        invoiceData = {
          ...sharedCustody,
          clientName: client.name,
          clientAddr1: client.addr1 || "",
          clientAddr2: client.addr2 || "",
          clientCountry: client.country || "",
          unitPrice: override.unitPrice !== undefined ? override.unitPrice : sharedCustody.unitPrice,
        };
      } else {
        invoiceData = {
          ...sharedConnect,
          clientName: client.name,
          clientAddr1: client.addr1 || "",
          clientAddr2: client.addr2 || "",
          clientCountry: client.country || "",
          lineItems: override.lineItems || defaultLineItems,
        };
      }

      // Render to hidden div, capture, save PDF
      await renderAndDownload(invoiceData, invoiceType, renderRef);
      // small delay between renders
      await new Promise(r => setTimeout(r, 300));
    }

    setGenerating(false);
    toast({ title: `${selectedClients.length} invoice(s) generated!` });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hidden render area */}
      <div ref={renderRef} style={{ position: "fixed", left: "-9999px", top: 0, width: "850px", background: "#fff", zIndex: -1 }} />

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Layers className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Bulk Invoice Generator</h1>
            <p className="text-sm text-muted-foreground">Generate invoices for multiple clients at once</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Shared Settings */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="text-sm font-bold text-foreground mb-4">Invoice Settings</h2>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Invoice Type</Label>
                  <Select value={invoiceType} onValueChange={setInvoiceType}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custody">Custody Invoice</SelectItem>
                      <SelectItem value="connect">Connect Partner Invoice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Invoice Prefix</Label>
                  <Input
                    value={invoiceType === "custody" ? sharedCustody.prefix : sharedConnect.prefix}
                    onChange={e => invoiceType === "custody" ? setSharedCustody(p => ({ ...p, prefix: e.target.value })) : setSharedConnect(p => ({ ...p, prefix: e.target.value }))}
                    className="h-9 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Invoice Date</Label>
                    <Input
                      type="date"
                      value={invoiceType === "custody" ? sharedCustody.invoiceDate : sharedConnect.invoiceDate}
                      onChange={e => invoiceType === "custody" ? setSharedCustody(p => ({ ...p, invoiceDate: e.target.value })) : setSharedConnect(p => ({ ...p, invoiceDate: e.target.value }))}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Due Date</Label>
                    <Input
                      type="date"
                      value={invoiceType === "custody" ? sharedCustody.dueDate : sharedConnect.dueDate}
                      onChange={e => invoiceType === "custody" ? setSharedCustody(p => ({ ...p, dueDate: e.target.value })) : setSharedConnect(p => ({ ...p, dueDate: e.target.value }))}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                {invoiceType === "custody" && (
                  <>
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Service Description</Label>
                      <Input value={sharedCustody.serviceDescription} onChange={e => setSharedCustody(p => ({ ...p, serviceDescription: e.target.value }))} className="h-9 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Default Unit Price ($)</Label>
                      <Input type="number" value={sharedCustody.unitPrice} onChange={e => setSharedCustody(p => ({ ...p, unitPrice: e.target.value }))} className="h-9 text-sm" />
                    </div>
                  </>
                )}

                {invoiceType === "connect" && (
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Service Month</Label>
                    <Select value={sharedConnect.serviceMonth} onValueChange={v => setSharedConnect(p => ({ ...p, serviceMonth: v }))}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["January","February","March","April","May","June","July","August","September","October","November","December"].map(m => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={generateAll}
              disabled={!selectedClients.length || generating}
              className="w-full bg-primary text-white hover:bg-primary/90 h-11 text-sm font-semibold"
            >
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
                <h2 className="text-sm font-bold text-foreground">Select Clients ({selectedClients.length}/{clients.length})</h2>
                <button onClick={toggleAll} className="text-xs text-primary hover:underline font-medium">
                  {selectedClients.length === clients.length ? "Deselect All" : "Select All"}
                </button>
              </div>

              {isLoading ? (
                <div className="text-center text-muted-foreground py-8 text-sm">Loading clients…</div>
              ) : clients.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 text-sm">No clients yet. Add clients on the Clients page first.</div>
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

                        {/* Per-client overrides */}
                        {selected && expanded && (
                          <div className="px-4 pb-4 border-t border-border pt-3 bg-card/50 rounded-b-lg">
                            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Override for {c.name}</p>
                            {invoiceType === "custody" ? (
                              <div>
                                <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Unit Price ($)</Label>
                                <Input
                                  type="number"
                                  placeholder={sharedCustody.unitPrice}
                                  value={override.unitPrice !== undefined ? override.unitPrice : ""}
                                  onChange={e => setOverride(c.id, { unitPrice: e.target.value === "" ? undefined : Number(e.target.value) })}
                                  className="h-8 text-sm w-40"
                                />
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {(override.lineItems || defaultLineItems).map((item, idx) => (
                                  <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                                    <div className="col-span-6">
                                      {idx === 0 && <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Description</Label>}
                                      <Input
                                        value={item.description}
                                        onChange={e => {
                                          const items = [...(override.lineItems || defaultLineItems)];
                                          items[idx] = { ...items[idx], description: e.target.value };
                                          setOverride(c.id, { lineItems: items });
                                        }}
                                        className="h-8 text-sm"
                                      />
                                    </div>
                                    <div className="col-span-2">
                                      {idx === 0 && <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Qty</Label>}
                                      <Input
                                        type="number"
                                        value={item.quantity}
                                        onChange={e => {
                                          const items = [...(override.lineItems || defaultLineItems)];
                                          items[idx] = { ...items[idx], quantity: Number(e.target.value) };
                                          setOverride(c.id, { lineItems: items });
                                        }}
                                        className="h-8 text-sm text-center"
                                      />
                                    </div>
                                    <div className="col-span-3">
                                      {idx === 0 && <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Price ($)</Label>}
                                      <Input
                                        type="number"
                                        value={item.unitPrice}
                                        onChange={e => {
                                          const items = [...(override.lineItems || defaultLineItems)];
                                          items[idx] = { ...items[idx], unitPrice: Number(e.target.value) };
                                          setOverride(c.id, { lineItems: items });
                                        }}
                                        className="h-8 text-sm text-right"
                                      />
                                    </div>
                                    <div className="col-span-1">
                                      <button
                                        onClick={() => {
                                          const items = (override.lineItems || defaultLineItems).filter((_, i) => i !== idx);
                                          setOverride(c.id, { lineItems: items });
                                        }}
                                        className="h-8 w-8 flex items-center justify-center text-destructive hover:bg-destructive/10 rounded"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                                <button
                                  onClick={() => {
                                    const items = [...(override.lineItems || defaultLineItems), { description: "", quantity: 1, unitPrice: 0 }];
                                    setOverride(c.id, { lineItems: items });
                                  }}
                                  className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                                >
                                  <Plus className="h-3 w-3" /> Add line
                                </button>
                              </div>
                            )}
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

async function renderAndDownload(invoiceData, type, containerRef) {
  const sfoxLogoUrl = "https://media.base44.com/images/public/6a049f1fdb040b9d18c5bf50/f444be89d_images_squarespace-cdn_com_sFOX_Logo_RGB_Navy_de6c2b39.png";
  const invoiceNum = generateInvoiceNumber(invoiceData.prefix, invoiceData.invoiceDate);

  const total = type === "custody"
    ? Number(invoiceData.quantity) * Number(invoiceData.unitPrice)
    : (invoiceData.lineItems || []).reduce((s, i) => s + Number(i.quantity) * Number(i.unitPrice), 0);

  const formatCurrency = (v) => "$" + Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Build HTML string for the invoice
  const html = buildInvoiceHtml(invoiceData, type, sfoxLogoUrl, invoiceNum, total, formatCurrency, formatDate);
  containerRef.current.innerHTML = html;
  await new Promise(r => setTimeout(r, 200));

  const canvas = await html2canvas(containerRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false });
  const imgData = canvas.toDataURL("image/png");
  // Use mm units so we can fit the image exactly onto one A4 page
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();   // 210mm
  const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm
  // Scale image to fit within the page while preserving aspect ratio
  const imgAspect = canvas.height / canvas.width;
  let imgW = pageWidth;
  let imgH = pageWidth * imgAspect;
  if (imgH > pageHeight) {
    imgH = pageHeight;
    imgW = pageHeight / imgAspect;
  }
  const offsetX = (pageWidth - imgW) / 2;
  const offsetY = (pageHeight - imgH) / 2;
  pdf.addImage(imgData, "PNG", offsetX, offsetY, imgW, imgH);
  pdf.save(`${invoiceNum.replace(/\s/g, "_")}_${invoiceData.clientName.replace(/\s/g, "_")}.pdf`);
  containerRef.current.innerHTML = "";
}

function buildInvoiceHtml(d, type, logoUrl, invoiceNum, total, fc, fd) {
  const rowsBg = "#f8fafc";
  const primaryColor = "#0091ff";
  const title = type === "custody" ? "CUSTODY INVOICE" : "CONNECT INVOICE";

  const tableRows = type === "custody"
    ? `<tr style="background:${rowsBg}">
        <td style="padding:12px 16px;font-weight:500">${d.serviceDescription}</td>
        <td style="padding:12px 16px;text-align:center">${d.quantity}</td>
        <td style="padding:12px 16px;text-align:right">${fc(d.unitPrice)}</td>
        <td style="padding:12px 16px;text-align:right;font-weight:700">${fc(Number(d.quantity) * Number(d.unitPrice))}</td>
      </tr>`
    : (d.lineItems || []).map((item, i) => `
        <tr style="background:${i % 2 === 0 ? rowsBg : "#fff"}">
          <td style="padding:12px 16px;font-weight:500">${item.description}</td>
          <td style="padding:12px 16px;text-align:center">${item.quantity}</td>
          <td style="padding:12px 16px;text-align:right">${fc(item.unitPrice)}</td>
          <td style="padding:12px 16px;text-align:right;font-weight:700">${fc(Number(item.quantity) * Number(item.unitPrice))}</td>
        </tr>`).join("");

  return `
    <div style="font-family:Arial,sans-serif;font-size:13px;color:#111;background:#fff;padding:32px;width:850px;box-sizing:border-box">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid #e2e8f0;padding-bottom:24px;margin-bottom:24px">
        <div>
          <img src="${logoUrl}" alt="sFOX" style="height:40px;margin-bottom:12px" />
          <div style="font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:1px">sFOX Inc &amp; affiliates</div>
          <div style="font-size:12px;color:#64748b;line-height:1.6;margin-top:4px">${d.companyAddr1}<br/>${d.companyAddr2}<br/>${d.companyPhone}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:22px;font-weight:900;text-transform:uppercase;letter-spacing:2px;border-bottom:2px solid #e2e8f0;padding-bottom:8px;margin-bottom:12px">${title}</div>
          <div style="font-size:13px;color:#64748b;margin-bottom:4px">Invoice Number: <strong style="color:#111">${invoiceNum}</strong></div>
          <div style="font-size:13px;color:#64748b;margin-bottom:4px">Date: <strong style="color:#111">${fd(d.invoiceDate)}</strong></div>
          <div style="font-size:13px;color:#64748b">Due Date: <strong style="color:#111">${fd(d.dueDate)}</strong></div>
        </div>
      </div>
      <div style="margin-bottom:24px">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-bottom:8px">Bill To:</div>
        <div style="font-weight:700;font-size:15px">${d.clientName}</div>
        <div style="font-size:13px;line-height:1.6;margin-top:4px">${d.clientAddr1}<br/>${d.clientAddr2}<br/>${d.clientCountry}</div>
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
      <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e2e8f0">
        <p style="font-size:13px;line-height:1.6;color:#374151;padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin:0 0 12px">${d.paymentNotice}</p>
        <p style="font-size:13px;color:#64748b">If you have any questions, contact <a href="mailto:${d.contactEmail}" style="color:${primaryColor};font-weight:700">${d.contactEmail}</a>.</p>
        <p style="font-size:13px;font-weight:700;margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0">Thank you for your business,<br/><span style="color:${primaryColor}">sFOX</span></p>
      </div>
    </div>`;
}