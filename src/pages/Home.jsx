import { motion } from "framer-motion";
import MonthlySummary from "@/components/MonthlySummary";
import InvoiceEditor from "@/components/invoices/InvoiceEditor";
import { businessProfiles } from "@/lib/businessProfiles";

export default function Home() {
  const profile = businessProfiles.alessa;
  const invoiceConfig = profile.invoiceTypes[0];

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
          <div className="print-hidden p-10 pb-0">
            <div className="flex flex-col items-center text-center mb-10">
              <img src={profile.logoUrl} alt="Alessa's Boat Clinic" className="h-28 w-auto object-contain mx-auto mb-4 rounded-2xl" onError={e => { e.target.style.display = 'none'; }} />
              <h1 className="text-5xl font-black tracking-tight text-foreground">Boat Clinic Invoicing</h1>
              <p className="text-base text-muted-foreground mt-2 font-medium">Professional vessel service billing — streamlined</p>
            </div>

            <MonthlySummary />
          </div>

          <div className="p-8 pt-0 print:p-0">
            <InvoiceEditor key="alessa-boatclinic" profile={profile} invoiceConfig={invoiceConfig} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}