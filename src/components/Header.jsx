import { Link, useLocation } from "react-router-dom";
import { FileText, Users, Layers, HelpCircle } from "lucide-react";

export default function Header() {
  const location = useLocation();
  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50 print:hidden">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-primary/10 p-1.5 rounded-lg group-hover:bg-primary/20 transition-colors">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <span className="font-bold text-base text-foreground tracking-tight" style={{ fontFamily: 'Arial, system-ui, sans-serif' }}>
            Invoice Generator
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <Link
            to="/clients"
            className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
              location.pathname === "/clients"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <Users className="h-4 w-4" />
            Clients
          </Link>
          <Link
            to="/bulk"
            className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
              location.pathname === "/bulk"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <Layers className="h-4 w-4" />
            Bulk Generate
          </Link>
          <Link
            to="/how-to-use"
            className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
              location.pathname === "/how-to-use"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <HelpCircle className="h-4 w-4" />
            Help
          </Link>
        </div>
      </div>
    </header>
  );
}