import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Printer, Download, FileText, Link as LinkIcon, Edit, RefreshCw, Check, X, Plus, Trash2, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import ClientSelector from "@/components/ClientSelector";
import MonthlySummary from "@/components/MonthlySummary";
import { base44 } from "@/api/base44Client";

// --- ANIMATION COMPONENTS ---
const AnimatedElement = ({ children, className, delay = 0 }) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) { setIsVisible(true); return; }
    const fallback = setTimeout(() => setIsVisible(true), 800 + delay);
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { clearTimeout(fallback); setTimeout(() => setIsVisible(true), delay); observer.unobserve(el); }
    }, { threshold: 0.05, rootMargin: '0px 0px 200px 0px' });
    observer.observe(el);
    return () => { observer.disconnect(); clearTimeout(fallback); };
  }, [delay]);
  return (
    <div ref={ref} className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className || ''}`}>
      {children}
    </div>
  );
};

// --- DATA MOCKS ---
const defaultCustody = {
  prefix: "RD",
  invoiceDate: "2025-03-10",
  dueDate: "2025-03-17",
  companyName: "",
  companyAddr1: "1712 Pioneer Avenue Suite 135",
  companyAddr2: "Cheyenne, WY 82001",
  companyPhone: "(424) 277-0535",
  clientName: "Reflect 14 Foundation",
  clientAddr1: "613 KENDAL LN",
  clientAddr2: "LEAGUE CITY, TX 77573",
  clientCountry: "US",
  serviceDescription: "Custody Fee",
  quantity: 1,
  unitPrice: 500.00,
  paymentNotice: "Your sFOX account will be charged by the due date. Please ensure there are sufficient funds available to cover the charges.",
  contactEmail: "clientservices@sfox.com",
};

const defaultConnect = {
  prefix: "ON",
  invoiceDate: "2025-03-10",
  dueDate: "2025-10-31",
  serviceMonth: "November",
  companyName: "",
  companyAddr1: "1712 Pioneer Avenue Suite 135",
  companyAddr2: "Cheyenne, WY 82001",
  companyPhone: "(424) 277-0535",
  clientName: "InvestiFi",
  clientAddr1: "8 The Green Suite 7529",
  clientAddr2: "Dover, DE 19901",
  clientCountry: "US",
  lineItems: [
    { description: "Nov 2026 Monthly Platform Fee", quantity: 1, unitPrice: 10000.00 },
    { description: "sFOX SAFE Segregated Wallets", quantity: 1, unitPrice: 2500.00 },
    { description: "Same day ACH Fee", quantity: 1, unitPrice: 750.00 },
  ],
  paymentNotice: "Your sFOX account will be charged by the due date. Please ensure there are sufficient funds available to cover the charges. Note that if the account lacks the necessary balance for the outstanding amount, this will result in an automatic suspension of access to Connect services.",
  contactEmail: "clientservices@sfox.com",
};

// --- UTILS ---
function formatDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${m}/${d}/${y}`;
}

function formatCurrency(val) {
  return "$" + Number(val || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function generateInvoiceNumber(prefix, dateStr) {
  const d = new Date(dateStr || Date.now());
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${prefix} - ${dd}${mm}${yyyy}`;
}

// --- MAIN COMPONENT ---
export default function Home() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("custody");
  const [downloading, setDownloading] = useState(false);
  const custodyInvoiceRef = useRef(null);
  const connectInvoiceRef = useRef(null);
  const [custodyData, setCustodyData] = useState({ ...defaultCustody });
  const [connectData, setConnectData] = useState({ ...defaultConnect });
  const [custodyEditOpen, setCustodyEditOpen] = useState(false);
  const [connectEditOpen, setConnectEditOpen] = useState(false);
  const [custodyTemp, setCustodyTemp] = useState({ ...defaultCustody });
  const [connectTemp, setConnectTemp] = useState({ ...defaultConnect, lineItems: defaultConnect.lineItems.map(i => ({ ...i })) });

  const custodyInvoiceNum = generateInvoiceNumber(custodyData.prefix, custodyData.invoiceDate);
  const connectInvoiceNum = generateInvoiceNumber(connectData.prefix, connectData.invoiceDate);

  const connectTotal = (connectData.lineItems || []).reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0);
  const connectTempTotal = (connectTemp.lineItems || []).reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0);

  function openCustodyEdit() { setCustodyTemp({ ...custodyData }); setCustodyEditOpen(true); }
  function openConnectEdit() { setConnectTemp({ ...connectData, lineItems: (connectData.lineItems || []).map(i => ({ ...i })) }); setConnectEditOpen(true); }
  function applyCustody() {
    setCustodyData({ ...custodyTemp });
    setCustodyEditOpen(false);
    toast({ title: "Invoice updated", description: "Custody invoice has been updated successfully." });
  }
  function applyConnect() {
    setConnectData({ ...connectTemp, lineItems: (connectTemp.lineItems || []).map(i => ({ ...i })) });
    setConnectEditOpen(false);
    toast({ title: "Invoice updated", description: "Connect Partner invoice has been updated successfully." });
  }
  function resetCustody() { setCustodyTemp({ ...defaultCustody }); }
  function resetConnect() { setConnectTemp({ ...defaultConnect, lineItems: defaultConnect.lineItems.map(i => ({ ...i })) }); }

  function addConnectLine() {
    setConnectTemp(prev => ({
      ...prev,
      lineItems: [...(prev.lineItems || []), { description: "", quantity: 1, unitPrice: 0 }]
    }));
  }
  function removeConnectLine(idx) {
    setConnectTemp(prev => ({ ...prev, lineItems: prev.lineItems.filter((_, i) => i !== idx) }));
  }
  function updateConnectLine(idx, field, value) {
    setConnectTemp(prev => {
      const items = prev.lineItems.map((item, i) => i === idx ? { ...item, [field]: value } : item);
      return { ...prev, lineItems: items };
    });
  }

  function handlePrint() {
    window.print();
  }

  function formatFileDate(dateStr) {
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

  async function handleDownloadPDF() {
    const isCustody = activeTab === "custody";
    const ref = isCustody ? custodyInvoiceRef : connectInvoiceRef;
    const data = isCustody ? custodyData : connectData;
    const invoiceType = isCustody ? "Custody Invoice" : "Connect Invoice";
    const clientName = (data.clientName || "Client").replace(/[/\\?%*:|"<>]/g, "-");
    const dateStr = formatFileDate(data.invoiceDate);
    const fileName = `${invoiceType}_${clientName}_${dateStr}.pdf`;

    if (!ref.current) return;
    setDownloading(true);
    const canvas = await html2canvas(ref.current, {
      scale: 3,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      removeContainer: true,
    });
    const imgData = canvas.toDataURL("image/png");
    const pageWidthMm = 210;
    const imgHeightMm = (canvas.height * pageWidthMm) / canvas.width;
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [pageWidthMm, imgHeightMm] });
    pdf.addImage(imgData, "PNG", 0, 0, pageWidthMm, imgHeightMm);
    pdf.save(fileName);

    // Save invoice history record
    const amount = isCustody
      ? Number(data.quantity) * Number(data.unitPrice)
      : (data.lineItems || []).reduce((s, i) => s + Number(i.quantity) * Number(i.unitPrice), 0);
    base44.entities.InvoiceHistory.create({
      client_id: data.clientId || "",
      client_name: data.clientName || "",
      invoice_type: isCustody ? "custody" : "connect",
      invoice_number: isCustody ? custodyInvoiceNum : connectInvoiceNum,
      invoice_date: data.invoiceDate || "",
      due_date: data.dueDate || "",
      amount,
      file_name: fileName,
    });

    setDownloading(false);
  }

  function handleGenerateNew() {
    const today = new Date().toISOString().split("T")[0];
    const due = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
    if (activeTab === "custody") {
      setCustodyData(prev => ({ ...prev, invoiceDate: today, dueDate: due }));
    } else {
      setConnectData(prev => ({ ...prev, invoiceDate: today }));
    }
  }

  const sfoxLogoUrl = "https://media.base44.com/images/public/6a049f1fdb040b9d18c5bf50/f444be89d_images_squarespace-cdn_com_sFOX_Logo_RGB_Navy_de6c2b39.png";

  return (
    <div className="min-h-screen bg-background relative font-sans">
      
      {/* Global CSS for Animations & Print */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes floatA { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-30px) rotate(5deg); } }
        @keyframes floatB { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-20px) rotate(-3deg); } }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @media print {
          @page { size: auto; margin: 0mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-hidden { display: none !important; }
          .print-full-page { 
            position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
            margin: 0; padding: 20px; box-shadow: none; border: none;
            width: 100vw; height: 100vh; background: white;
            z-index: 9999; overflow: visible;
          }
          .print-full-page table th { background-color: hsl(var(--primary)) !important; color: hsl(var(--primary-foreground)) !important; }
        }
      `}} />

      {/* Ambient glowing background orbs (Hidden on print) */}
      <div className="print-hidden fixed -top-32 -right-32 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none z-0" style={{ animation: 'floatA 12s ease-in-out infinite' }} />
      <div className="print-hidden fixed -bottom-40 -left-20 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px] pointer-events-none z-0" style={{ animation: 'floatB 15s ease-in-out infinite reverse' }} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-12 print:py-0 print:px-0">
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="bg-card rounded-2xl shadow-2xl border border-border/40 overflow-hidden print:shadow-none print:border-none print:rounded-none"
        >
          {/* Top Wrapper (Hidden on print) */}
          <div className="print-hidden p-8 pb-0">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold tracking-tight text-foreground" style={{ fontFamily: 'Arial, system-ui, sans-serif' }}>
                Invoice Generator
              </h1>
            </div>

            <MonthlySummary />

            {/* Tab Switcher */}
            <div className="flex border-b border-border mb-8 gap-2 relative">
              <button
                onClick={() => setActiveTab("custody")}
                className={`relative flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-all duration-300 rounded-t-lg overflow-hidden group ${
                  activeTab === "custody"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-foreground/60 hover:bg-secondary/80 hover:text-foreground"
                }`}
              >
                {activeTab === "custody" && (
                  <div className="absolute inset-0 bg-white/20 w-[150%] -skew-x-12 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                )}
                <FileText className="h-4 w-4 relative z-10" />
                <span className="relative z-10">Custody Invoice</span>
              </button>
              <button
                onClick={() => setActiveTab("connect")}
                className={`relative flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-all duration-300 rounded-t-lg overflow-hidden group ${
                  activeTab === "connect"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-foreground/60 hover:bg-secondary/80 hover:text-foreground"
                }`}
              >
                {activeTab === "connect" && (
                  <div className="absolute inset-0 bg-white/20 w-[150%] -skew-x-12 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                )}
                <LinkIcon className="h-4 w-4 relative z-10" />
                <span className="relative z-10">Connect Partner Invoice</span>
              </button>
            </div>
          </div>

          <div className="p-8 pt-0 print:p-0">
            {/* === CUSTODY TAB === */}
            {activeTab === "custody" && (
              <AnimatedElement delay={100} className="space-y-6">
                
                {/* Action Buttons (Hidden on print) */}
                <div className="print-hidden flex flex-wrap gap-3 mb-6 bg-secondary/30 p-4 rounded-xl border border-border/50">
                  <Button
                    onClick={openCustodyEdit}
                    className="bg-primary text-white hover:bg-primary/90 hover:shadow-lg hover:scale-105 active:scale-95 transition-all shadow-sm"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Custody Invoice
                  </Button>
                  <Button
                    onClick={handleGenerateNew}
                    variant="outline"
                    className="border-primary text-primary hover:bg-primary hover:text-white hover:shadow-lg hover:scale-105 active:scale-95 transition-all shadow-sm"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate New
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handlePrint}
                    className="border-border text-foreground hover:bg-muted hover:shadow-md hover:scale-105 active:scale-95 transition-all shadow-sm"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDownloadPDF}
                    disabled={downloading}
                    className="border-border text-foreground hover:bg-muted hover:shadow-md hover:scale-105 active:scale-95 transition-all shadow-sm"
                  >
                    {downloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                    Download PDF
                  </Button>
                </div>

                {/* Invoice Summary Bar (Hidden on print) */}
                <div className="print-hidden flex flex-wrap gap-6 items-center bg-muted/40 border border-border/50 rounded-xl px-6 py-4 mb-8 text-sm shadow-inner backdrop-blur-sm">
                  <div className="flex flex-col"><span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Invoice #</span><span className="text-foreground font-medium">{custodyInvoiceNum}</span></div>
                  <div className="w-px h-8 bg-border/80 hidden sm:block"></div>
                  <div className="flex flex-col"><span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Date</span><span className="text-foreground font-medium">{formatDate(custodyData.invoiceDate)}</span></div>
                  <div className="w-px h-8 bg-border/80 hidden sm:block"></div>
                  <div className="flex flex-col"><span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Due</span><span className="text-foreground font-medium">{formatDate(custodyData.dueDate)}</span></div>
                  <div className="w-px h-8 bg-border/80 hidden sm:block"></div>
                  <div className="flex flex-col"><span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Amount</span><span className="text-primary font-bold text-base">{formatCurrency(Number(custodyData.quantity) * Number(custodyData.unitPrice))}</span></div>
                </div>

                {/* Edit Form Modal/Panel (Hidden on print) */}
                {custodyEditOpen && (
                  <AnimatedElement className="print-hidden border border-border/60 rounded-2xl bg-card shadow-2xl p-6 mb-8 relative overflow-hidden ring-1 ring-black/5">
                    <div className="absolute top-0 left-0 w-1 h-full bg-accent" />
                    <div className="flex items-center justify-between mb-6 border-b border-border/50 pb-4">
                      <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Edit className="h-5 w-5 text-accent" />
                        Edit Custody Invoice Details
                      </h3>
                      <button onClick={() => setCustodyEditOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded-full">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    
                    <ClientSelector onSelect={c => setCustodyTemp(p => ({ ...p, clientId: c.id, clientName: c.name, clientAddr1: c.addr1 || "", clientAddr2: c.addr2 || "", clientCountry: c.country || "" }))} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      {/* Invoice Info */}
                      <div className="bg-secondary/20 p-5 rounded-xl border border-border/40">
                        <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Invoice Information</h4>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Invoice Prefix</Label>
                            <Input value={custodyTemp.prefix} onChange={e => setCustodyTemp(p => ({ ...p, prefix: e.target.value }))} className="bg-card h-9 text-sm focus-visible:ring-primary" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Invoice Date</Label>
                              <Input type="date" value={custodyTemp.invoiceDate} onChange={e => setCustodyTemp(p => ({ ...p, invoiceDate: e.target.value }))} className="bg-card h-9 text-sm" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Due Date</Label>
                              <Input type="date" value={custodyTemp.dueDate} onChange={e => setCustodyTemp(p => ({ ...p, dueDate: e.target.value }))} className="bg-card h-9 text-sm" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Company Info */}
                      <div className="bg-secondary/20 p-5 rounded-xl border border-border/40">
                        <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary" /> Company Information</h4>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Company Name (Optional)</Label>
                            <Input value={custodyTemp.companyName} onChange={e => setCustodyTemp(p => ({ ...p, companyName: e.target.value }))} className="bg-card h-9 text-sm" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Address Line 1</Label>
                              <Input value={custodyTemp.companyAddr1} onChange={e => setCustodyTemp(p => ({ ...p, companyAddr1: e.target.value }))} className="bg-card h-9 text-sm" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Address Line 2</Label>
                              <Input value={custodyTemp.companyAddr2} onChange={e => setCustodyTemp(p => ({ ...p, companyAddr2: e.target.value }))} className="bg-card h-9 text-sm" />
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Phone</Label>
                            <Input value={custodyTemp.companyPhone} onChange={e => setCustodyTemp(p => ({ ...p, companyPhone: e.target.value }))} className="bg-card h-9 text-sm" />
                          </div>
                        </div>
                      </div>

                      {/* Client Info */}
                      <div className="bg-secondary/20 p-5 rounded-xl border border-border/40">
                        <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-accent" /> Client Information</h4>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Client Name</Label>
                            <Input value={custodyTemp.clientName} onChange={e => setCustodyTemp(p => ({ ...p, clientName: e.target.value }))} className="bg-card h-9 text-sm" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Address Line 1</Label>
                              <Input value={custodyTemp.clientAddr1} onChange={e => setCustodyTemp(p => ({ ...p, clientAddr1: e.target.value }))} className="bg-card h-9 text-sm" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Address Line 2</Label>
                              <Input value={custodyTemp.clientAddr2} onChange={e => setCustodyTemp(p => ({ ...p, clientAddr2: e.target.value }))} className="bg-card h-9 text-sm" />
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Country</Label>
                            <Input value={custodyTemp.clientCountry} onChange={e => setCustodyTemp(p => ({ ...p, clientCountry: e.target.value }))} className="bg-card h-9 text-sm" />
                          </div>
                        </div>
                      </div>

                      {/* Service Details */}
                      <div className="bg-secondary/20 p-5 rounded-xl border border-border/40">
                        <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary" /> Service Details</h4>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Service Description</Label>
                            <Input value={custodyTemp.serviceDescription} onChange={e => setCustodyTemp(p => ({ ...p, serviceDescription: e.target.value }))} className="bg-card h-9 text-sm" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Quantity</Label>
                              <Input type="number" value={custodyTemp.quantity} onChange={e => setCustodyTemp(p => ({ ...p, quantity: e.target.value }))} className="bg-card h-9 text-sm" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Unit Price ($)</Label>
                              <Input type="number" value={custodyTemp.unitPrice} onChange={e => setCustodyTemp(p => ({ ...p, unitPrice: e.target.value }))} className="bg-card h-9 text-sm" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Info */}
                    <div className="mt-6 bg-secondary/20 p-5 rounded-xl border border-border/40">
                      <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-muted-foreground" /> Footer Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Payment Notice</Label>
                          <Textarea value={custodyTemp.paymentNotice} onChange={e => setCustodyTemp(p => ({ ...p, paymentNotice: e.target.value }))} className="bg-card text-sm min-h-[100px] resize-none" />
                        </div>
                        <div>
                          <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Contact Email</Label>
                          <Input type="email" value={custodyTemp.contactEmail} onChange={e => setCustodyTemp(p => ({ ...p, contactEmail: e.target.value }))} className="bg-card h-9 text-sm" />
                        </div>
                      </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex gap-3 mt-8 border-t border-border/50 pt-5">
                      <Button onClick={applyCustody} className="bg-primary text-white hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all shadow-md">
                        <Check className="h-4 w-4 mr-2" /> Apply Changes
                      </Button>
                      <Button onClick={resetCustody} variant="outline" className="border-border hover:bg-muted hover:scale-105 active:scale-95 transition-all">
                        <RefreshCw className="h-4 w-4 mr-2" /> Reset
                      </Button>
                    </div>
                  </AnimatedElement>
                )}

                {/* --- INVOICE PREVIEW DOCUMENT --- */}
                <AnimatedElement delay={200} className="flex justify-center print-full-page">
                  <div ref={custodyInvoiceRef} className="w-full max-w-[850px] border-2 border-primary bg-card shadow-2xl print:shadow-none print:border-none mx-auto print:max-w-none print:w-full">
                    
                    {/* Invoice Header */}
                    <div className="flex justify-between items-start p-10 pb-6 border-b border-border print:p-0 print:pb-6 print:pt-4">
                      <div className="flex flex-col items-start gap-4">
                        <img src={sfoxLogoUrl} alt="sFOX Logo" className="h-10 w-auto object-contain" onError={e => { e.target.style.display='none'; }} />
                        <div>
                          <div className="font-bold text-sm text-foreground uppercase tracking-wide mb-1">sFOX Inc &amp; affiliates</div>
                          <div className="text-xs text-muted-foreground leading-relaxed font-medium">
                            {custodyData.companyAddr1}<br/>
                            {custodyData.companyAddr2}<br/>
                            {custodyData.companyPhone}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-foreground mb-4 uppercase tracking-widest border-b-2 border-primary/20 pb-2 inline-block">
                          Custody Invoice
                        </div>
                        <div className="space-y-1.5">
                          <div className="text-sm text-muted-foreground flex justify-end gap-2"><span>Invoice Number:</span> <span className="font-bold text-foreground">{custodyInvoiceNum}</span></div>
                          <div className="text-sm text-muted-foreground flex justify-end gap-2"><span>Date:</span> <span className="font-bold text-foreground">{formatDate(custodyData.invoiceDate)}</span></div>
                          <div className="text-sm text-muted-foreground flex justify-end gap-2"><span>Due Date:</span> <span className="font-bold text-foreground">{formatDate(custodyData.dueDate)}</span></div>
                        </div>
                      </div>
                    </div>

                    {/* Bill To */}
                    <div className="px-10 py-6 print:px-0 print:py-4">
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Bill To:</div>
                      <div className="text-base font-bold text-foreground mb-1">{custodyData.clientName}</div>
                      <div className="text-sm text-foreground leading-relaxed">
                        {custodyData.clientAddr1}<br/>
                        {custodyData.clientAddr2}<br/>
                        {custodyData.clientCountry}
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
                            <tr className="border-b border-border bg-card">
                              <td className="px-5 py-4 font-medium text-foreground">{custodyData.serviceDescription}</td>
                              <td className="px-5 py-4 text-center text-foreground font-medium">{custodyData.quantity}</td>
                              <td className="px-5 py-4 text-right text-foreground font-medium">{formatCurrency(custodyData.unitPrice)}</td>
                              <td className="px-5 py-4 text-right text-foreground font-bold">{formatCurrency(Number(custodyData.quantity) * Number(custodyData.unitPrice))}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="flex justify-end mt-6">
                        <div className="bg-muted/30 px-6 py-4 rounded-lg border border-border/50 print:border-none print:bg-transparent print:p-0 flex items-center gap-4">
                          <span className="text-base font-bold text-muted-foreground uppercase tracking-wider">Total Due:</span>
                          <span className="text-2xl font-black text-primary">{formatCurrency(Number(custodyData.quantity) * Number(custodyData.unitPrice))}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="px-10 py-8 bg-secondary/10 border-t border-border print:px-0 print:bg-transparent print:pt-4">
                      <div className="max-w-2xl space-y-4">
                        <p className="text-sm text-card-foreground leading-relaxed bg-card p-4 rounded-lg border border-border/40 shadow-sm print:shadow-none print:border-none print:p-0 print:bg-transparent">
                          {custodyData.paymentNotice}
                        </p>
                        <p className="text-sm text-muted-foreground font-medium">
                          If you have any questions concerning this invoice, please contact{" "}
                          <a href={`mailto:${custodyData.contactEmail}`} className="text-primary hover:underline font-bold transition-colors">{custodyData.contactEmail}</a>.
                        </p>
                        <div className="pt-4 mt-4 border-t border-border/30 print:border-none">
                          <p className="text-sm font-bold text-foreground">Thank you for your business,<br /><span className="text-primary">sFOX</span></p>
                        </div>
                      </div>
                    </div>

                  </div>
                </AnimatedElement>
              </AnimatedElement>
            )}

            {/* === CONNECT TAB === */}
            {activeTab === "connect" && (
              <AnimatedElement delay={100} className="space-y-6">
                
                {/* Action Buttons (Hidden on print) */}
                <div className="print-hidden flex flex-wrap gap-3 mb-6 bg-secondary/30 p-4 rounded-xl border border-border/50">
                  <Button
                    onClick={openConnectEdit}
                    className="bg-primary text-white hover:bg-primary/90 hover:shadow-lg hover:scale-105 active:scale-95 transition-all shadow-sm"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Connect Invoice
                  </Button>
                  <Button
                    onClick={handleGenerateNew}
                    variant="outline"
                    className="border-primary text-primary hover:bg-primary hover:text-white hover:shadow-lg hover:scale-105 active:scale-95 transition-all shadow-sm"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate New
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handlePrint}
                    className="border-border text-foreground hover:bg-muted hover:shadow-md hover:scale-105 active:scale-95 transition-all shadow-sm"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDownloadPDF}
                    disabled={downloading}
                    className="border-border text-foreground hover:bg-muted hover:shadow-md hover:scale-105 active:scale-95 transition-all shadow-sm"
                  >
                    {downloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                    Download PDF
                  </Button>
                </div>

                {/* Invoice Summary Bar (Hidden on print) */}
                <div className="print-hidden flex flex-wrap gap-6 items-center bg-muted/40 border border-border/50 rounded-xl px-6 py-4 mb-8 text-sm shadow-inner backdrop-blur-sm">
                  <div className="flex flex-col"><span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Invoice #</span><span className="text-foreground font-medium">{connectInvoiceNum}</span></div>
                  <div className="w-px h-8 bg-border/80 hidden sm:block"></div>
                  <div className="flex flex-col"><span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Date</span><span className="text-foreground font-medium">{formatDate(connectData.invoiceDate)}</span></div>
                  <div className="w-px h-8 bg-border/80 hidden sm:block"></div>
                  <div className="flex flex-col"><span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Due</span><span className="text-foreground font-medium">{formatDate(connectData.dueDate)}</span></div>
                  <div className="w-px h-8 bg-border/80 hidden sm:block"></div>
                  <div className="flex flex-col"><span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Amount</span><span className="text-primary font-bold text-base">{formatCurrency(connectTotal)}</span></div>
                </div>

                {/* Edit Form Modal/Panel (Hidden on print) */}
                {connectEditOpen && (
                  <AnimatedElement className="print-hidden border border-border/60 rounded-2xl bg-card shadow-2xl p-6 mb-8 relative overflow-hidden ring-1 ring-black/5">
                    <div className="absolute top-0 left-0 w-1 h-full bg-accent" />
                    <div className="flex items-center justify-between mb-6 border-b border-border/50 pb-4">
                      <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Edit className="h-5 w-5 text-accent" />
                        Edit Connect Partner Invoice Details
                      </h3>
                      <button onClick={() => setConnectEditOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded-full">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    
                    <ClientSelector onSelect={c => setConnectTemp(p => ({ ...p, clientId: c.id, clientName: c.name, clientAddr1: c.addr1 || "", clientAddr2: c.addr2 || "", clientCountry: c.country || "" }))} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      {/* Invoice Info */}
                      <div className="bg-secondary/20 p-5 rounded-xl border border-border/40">
                        <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Invoice Information</h4>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Invoice Prefix</Label>
                            <Input value={connectTemp.prefix} onChange={e => setConnectTemp(p => ({ ...p, prefix: e.target.value }))} className="bg-card h-9 text-sm" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Invoice Date</Label>
                              <Input type="date" value={connectTemp.invoiceDate} onChange={e => setConnectTemp(p => ({ ...p, invoiceDate: e.target.value }))} className="bg-card h-9 text-sm" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Due Date</Label>
                              <Input type="date" value={connectTemp.dueDate} onChange={e => setConnectTemp(p => ({ ...p, dueDate: e.target.value }))} className="bg-card h-9 text-sm" />
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Service Month</Label>
                            <Select value={connectTemp.serviceMonth} onValueChange={val => setConnectTemp(p => ({ ...p, serviceMonth: val }))}>
                              <SelectTrigger className="bg-card h-9 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {["January","February","March","April","May","June","July","August","September","October","November","December"].map(m => (
                                  <SelectItem key={m} value={m}>{m}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* Company Info */}
                      <div className="bg-secondary/20 p-5 rounded-xl border border-border/40">
                        <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary" /> Company Information</h4>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Company Name (Optional)</Label>
                            <Input value={connectTemp.companyName} onChange={e => setConnectTemp(p => ({ ...p, companyName: e.target.value }))} className="bg-card h-9 text-sm" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Address Line 1</Label>
                              <Input value={connectTemp.companyAddr1} onChange={e => setConnectTemp(p => ({ ...p, companyAddr1: e.target.value }))} className="bg-card h-9 text-sm" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Address Line 2</Label>
                              <Input value={connectTemp.companyAddr2} onChange={e => setConnectTemp(p => ({ ...p, companyAddr2: e.target.value }))} className="bg-card h-9 text-sm" />
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Phone</Label>
                            <Input value={connectTemp.companyPhone} onChange={e => setConnectTemp(p => ({ ...p, companyPhone: e.target.value }))} className="bg-card h-9 text-sm" />
                          </div>
                        </div>
                      </div>

                      {/* Client Info */}
                      <div className="bg-secondary/20 p-5 rounded-xl border border-border/40 md:col-span-2">
                        <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-accent" /> Client Information</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Client Name</Label>
                            <Input value={connectTemp.clientName} onChange={e => setConnectTemp(p => ({ ...p, clientName: e.target.value }))} className="bg-card h-9 text-sm" />
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Address Line 1</Label>
                            <Input value={connectTemp.clientAddr1} onChange={e => setConnectTemp(p => ({ ...p, clientAddr1: e.target.value }))} className="bg-card h-9 text-sm" />
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Address Line 2</Label>
                            <Input value={connectTemp.clientAddr2} onChange={e => setConnectTemp(p => ({ ...p, clientAddr2: e.target.value }))} className="bg-card h-9 text-sm" />
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Country</Label>
                            <Input value={connectTemp.clientCountry} onChange={e => setConnectTemp(p => ({ ...p, clientCountry: e.target.value }))} className="bg-card h-9 text-sm" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Line Items */}
                    <div className="mt-6 bg-secondary/20 p-5 rounded-xl border border-border/40">
                      <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary" /> Service Line Items</h4>
                      <div className="space-y-3">
                        {(connectTemp.lineItems || []).map((item, idx) => (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                            key={idx} className="bg-card border border-border/50 rounded-lg p-4 shadow-sm hover:border-primary/30 transition-colors"
                          >
                            <div className="flex justify-between items-center mb-3 border-b border-border/40 pb-2">
                              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Line Item {idx + 1}</span>
                              <Button
                                type="button" variant="ghost" size="sm" onClick={() => removeConnectLine(idx)}
                                className="h-6 text-xs text-destructive hover:bg-destructive/10 px-2"
                              >
                                <Trash2 className="h-3 w-3 mr-1.5" /> Remove
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                              <div className="sm:col-span-5">
                                <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Description</Label>
                                <Input placeholder="Service description" value={item.description} onChange={e => updateConnectLine(idx, "description", e.target.value)} className="h-9 text-sm" />
                              </div>
                              <div className="sm:col-span-2">
                                <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Quantity</Label>
                                <Input type="number" value={item.quantity} onChange={e => updateConnectLine(idx, "quantity", e.target.value)} className="h-9 text-sm text-center" />
                              </div>
                              <div className="sm:col-span-2">
                                <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Unit Price ($)</Label>
                                <Input type="number" value={item.unitPrice} onChange={e => updateConnectLine(idx, "unitPrice", e.target.value)} className="h-9 text-sm text-right" />
                              </div>
                              <div className="sm:col-span-3">
                                <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Total</Label>
                                <Input readOnly value={formatCurrency(Number(item.quantity) * Number(item.unitPrice))} className="h-9 text-sm bg-muted/50 font-bold text-right border-border/50" />
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      
                      <div className="flex justify-between items-center mt-4 pt-4 border-t border-border/50">
                        <Button type="button" variant="outline" size="sm" onClick={addConnectLine} className="border-primary text-primary hover:bg-primary/10 hover:scale-105 active:scale-95 transition-all">
                          <Plus className="h-4 w-4 mr-1.5" /> Add Line Item
                        </Button>
                        <div className="flex items-center gap-3 bg-card px-4 py-2 rounded-lg border border-border/50 shadow-sm">
                          <span className="text-sm font-bold text-muted-foreground uppercase">Total:</span>
                          <span className="text-lg font-black text-primary">{formatCurrency(connectTempTotal)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Info */}
                    <div className="mt-6 bg-secondary/20 p-5 rounded-xl border border-border/40">
                      <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-muted-foreground" /> Footer Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Payment Notice</Label>
                          <Textarea value={connectTemp.paymentNotice} onChange={e => setConnectTemp(p => ({ ...p, paymentNotice: e.target.value }))} className="bg-card text-sm min-h-[100px] resize-none" />
                        </div>
                        <div>
                          <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Contact Email</Label>
                          <Input type="email" value={connectTemp.contactEmail} onChange={e => setConnectTemp(p => ({ ...p, contactEmail: e.target.value }))} className="bg-card h-9 text-sm" />
                        </div>
                      </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex gap-3 mt-8 border-t border-border/50 pt-5">
                      <Button onClick={applyConnect} className="bg-primary text-white hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all shadow-md">
                        <Check className="h-4 w-4 mr-2" /> Apply Changes
                      </Button>
                      <Button onClick={resetConnect} variant="outline" className="border-border hover:bg-muted hover:scale-105 active:scale-95 transition-all">
                        <RefreshCw className="h-4 w-4 mr-2" /> Reset
                      </Button>
                    </div>
                  </AnimatedElement>
                )}

                {/* --- CONNECT INVOICE PREVIEW DOCUMENT --- */}
                <AnimatedElement delay={200} className="flex justify-center print-full-page">
                  <div ref={connectInvoiceRef} className="w-full max-w-[850px] border-2 border-primary bg-card shadow-2xl print:shadow-none print:border-none mx-auto print:max-w-none print:w-full">
                    
                    {/* Invoice Header */}
                    <div className="flex justify-between items-start p-10 pb-6 border-b border-border print:p-0 print:pb-6 print:pt-4">
                      <div className="flex flex-col items-start gap-4">
                        <img src={sfoxLogoUrl} alt="sFOX Logo" className="h-10 w-auto object-contain" onError={e => { e.target.style.display='none'; }} />
                        <div>
                          <div className="font-bold text-sm text-foreground uppercase tracking-wide mb-1">sFOX Inc &amp; affiliates</div>
                          <div className="text-xs text-muted-foreground leading-relaxed font-medium">
                            {connectData.companyAddr1}<br/>
                            {connectData.companyAddr2}<br/>
                            {connectData.companyPhone}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-foreground mb-4 uppercase tracking-widest border-b-2 border-primary/20 pb-2 inline-block">
                          Connect Invoice
                        </div>
                        <div className="space-y-1.5">
                          <div className="text-sm text-muted-foreground flex justify-end gap-2"><span>Invoice Number:</span> <span className="font-bold text-foreground">{connectInvoiceNum}</span></div>
                          <div className="text-sm text-muted-foreground flex justify-end gap-2"><span>Date:</span> <span className="font-bold text-foreground">{formatDate(connectData.invoiceDate)}</span></div>
                          <div className="text-sm text-muted-foreground flex justify-end gap-2"><span>Due Date:</span> <span className="font-bold text-foreground">{formatDate(connectData.dueDate)}</span></div>
                        </div>
                      </div>
                    </div>

                    {/* Bill To */}
                    <div className="px-10 py-6 print:px-0 print:py-4">
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Bill To:</div>
                      <div className="text-base font-bold text-foreground mb-1">{connectData.clientName}</div>
                      <div className="text-sm text-foreground leading-relaxed">
                        {connectData.clientAddr1}<br/>
                        {connectData.clientAddr2}<br/>
                        {connectData.clientCountry}
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
                            {(connectData.lineItems || []).map((item, idx) => (
                              <tr key={idx} className="border-b border-border bg-card last:border-b-0 hover:bg-muted/30 transition-colors">
                                <td className="px-5 py-4 font-medium text-foreground">{item.description}</td>
                                <td className="px-5 py-4 text-center text-foreground font-medium">{item.quantity}</td>
                                <td className="px-5 py-4 text-right text-foreground font-medium">{formatCurrency(item.unitPrice)}</td>
                                <td className="px-5 py-4 text-right text-foreground font-bold">{formatCurrency(Number(item.quantity) * Number(item.unitPrice))}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="flex justify-end mt-6">
                        <div className="bg-muted/30 px-6 py-4 rounded-lg border border-border/50 print:border-none print:bg-transparent print:p-0 flex items-center gap-4">
                          <span className="text-base font-bold text-muted-foreground uppercase tracking-wider">Total Due:</span>
                          <span className="text-2xl font-black text-primary">{formatCurrency(connectTotal)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="px-10 py-8 bg-secondary/10 border-t border-border print:px-0 print:bg-transparent print:pt-4">
                      <div className="max-w-2xl space-y-4">
                        <p className="text-sm text-card-foreground leading-relaxed bg-card p-4 rounded-lg border border-border/40 shadow-sm print:shadow-none print:border-none print:p-0 print:bg-transparent">
                          {connectData.paymentNotice}
                        </p>
                        <p className="text-sm text-muted-foreground font-medium">
                          If you have any questions concerning this invoice, please contact{" "}
                          <a href={`mailto:${connectData.contactEmail}`} className="text-primary hover:underline font-bold transition-colors">{connectData.contactEmail}</a>.
                        </p>
                        <div className="pt-4 mt-4 border-t border-border/30 print:border-none">
                          <p className="text-sm font-bold text-foreground">Thank you for your business,<br /><span className="text-primary">sFOX</span></p>
                        </div>
                      </div>
                    </div>

                  </div>
                </AnimatedElement>
              </AnimatedElement>
            )}
            
          </div>
        </motion.div>
      </div>
    </div>
  );
}