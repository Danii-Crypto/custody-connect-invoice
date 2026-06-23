import { useState } from "react";
import { motion } from "framer-motion";
import MonthlySummary from "@/components/MonthlySummary";
import InvoiceEditor from "@/components/invoices/InvoiceEditor";
import { businessProfiles } from "@/lib/businessProfiles";

export default function Home() {
  const [profileId, setProfileId] = useState("sfox");
  const [activeInvoiceId, setActiveInvoiceId] = useState("custody");
  const profile = businessProfiles[profileId];
  const invoiceConfig = profile.invoiceTypes.find(t => t.id === activeInvoiceId) || profile.invoiceTypes[0];

  function handleProfileChange(id) {
    setProfileId(id);
    setActiveInvoiceId(businessProfiles[id].invoiceTypes[0].id);
  }

  return (
    <div className="min-h-screen bg-background relative font-sans">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes floatA { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-30px) rotate(5deg); } }
        @keyframes floatB { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-20px) rotate(-3deg); } }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @media print {
          @page { size: auto; margin: 0mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-hidden { display: none !important; }
          .print-full-page { position: fixed; top: 0; left: 0; right: 0; bottom: 0; margin: 0; padding: 20px; box-shadow: none; border: none; width: 100vw; height: 100vh; background: white; z-index: 9999; overflow: visible; }
          .print-full-page table th { background-color: hsl(var(--primary)) !important; color: hsl(var(--primary-foreground)) !important; }
        }
      ` }} />

      <div className="print-hidden fixed -top-32 -right-32 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none z-0" style={{ animation: 'floatA 12s ease-in-out infinite' }} />
      <div className="print-hidden fixed -bottom-40 -left-20 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px] pointer-events-none z-0" style={{ animation: 'floatB 15s ease-in-out infinite reverse' }} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-12 print:py-0 print:px-0">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="bg-card rounded-2xl shadow-2xl border border-border/40 overflow-hidden print:shadow-none print:border-none print:rounded-none">
          <div className="print-hidden p-8 pb-0">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold tracking-tight text-foreground">Invoice Generator</h1>
            </div>

            {/* Business Profile Selector */}
            <div className="flex justify-center gap-3 mb-6">
              {Object.values(businessProfiles).map(p => (
                <button key={p.id} onClick={() => handleProfileChange(p.id)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${profileId === p.id ? "bg-accent text-white shadow-md" : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"}`}>
                  <img src={p.logoUrl} alt="" className="h-5 w-5 object-contain rounded-full bg-white/10" onError={e => { e.target.style.display = 'none'; }} />
                  {p.name}
                </button>
              ))}
            </div>

            <MonthlySummary />

            {/* Tab Switcher */}
            <div className="flex border-b border-border mb-8 gap-2 relative">
              {profile.invoiceTypes.map(t => (
                <button key={t.id} onClick={() => setActiveInvoiceId(t.id)} className={`relative flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-all duration-300 rounded-t-lg overflow-hidden group ${activeInvoiceId === t.id ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary text-foreground/60 hover:bg-secondary/80 hover:text-foreground"}`}>
                  {activeInvoiceId === t.id && <div className="absolute inset-0 bg-white/20 w-[150%] -skew-x-12 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />}
                  <span className="relative z-10">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-8 pt-0 print:p-0">
            <InvoiceEditor key={`${profileId}-${activeInvoiceId}`} profile={profile} invoiceConfig={invoiceConfig} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}