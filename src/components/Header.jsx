import { Link } from "react-router-dom";
import { FileText, Navigation } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link 
          to="/" 
          className="flex items-center gap-2 group transition-transform hover:scale-105 active:scale-95"
        >
          <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <span className="font-bold text-lg text-foreground tracking-tight" style={{ fontFamily: 'Arial, system-ui, sans-serif' }}>
            sFOX Tools
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden sm:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <Link to="/" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
            Invoice Generator
          </Link>
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Settings
          </Link>
          
          <div className="h-4 w-px bg-border mx-2" />
          
          <button className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-all hover:scale-105 active:scale-95 shadow-sm hover:shadow">
            <Navigation className="h-4 w-4" />
            Go to App
          </button>
        </nav>

        {/* Mobile Menu Toggle */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="sm:hidden p-2 text-foreground hover:bg-muted rounded-md transition-colors"
        >
          <div className="space-y-1.5">
            <span className={`block w-5 h-0.5 bg-current transform transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-5 h-0.5 bg-current transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : 'opacity-100'}`} />
            <span className={`block w-5 h-0.5 bg-current transform transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </div>
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`sm:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-64 border-t border-border' : 'max-h-0'}`}>
        <div className="px-4 py-4 bg-card space-y-3 shadow-inner">
          <Link to="/" className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2">
            Dashboard
          </Link>
          <Link to="/" className="block text-sm font-medium text-primary py-2">
            Invoice Generator
          </Link>
          <Link to="/" className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2">
            Settings
          </Link>
          <button className="w-full mt-2 flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium shadow-sm active:scale-95 transition-transform">
            Go to App
          </button>
        </div>
      </div>
    </header>
  );
}