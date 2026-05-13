import { Link } from "react-router-dom";
import { FileText } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50 print:hidden">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-primary/10 p-1.5 rounded-lg group-hover:bg-primary/20 transition-colors">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <span className="font-bold text-base text-foreground tracking-tight" style={{ fontFamily: 'Arial, system-ui, sans-serif' }}>
            sFOX Invoice Generator
          </span>
        </Link>
      </div>
    </header>
  );
}