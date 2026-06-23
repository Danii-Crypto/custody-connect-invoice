import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Ship, HelpCircle, Moon, Sun, BarChart3, Users, LogOut } from "lucide-react";
import { getTheme, setTheme } from "@/lib/theme";
import { useAuth } from "@/lib/AuthContext";

export default function Header() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [dark, setDark] = useState(() => getTheme() === "dark");
  const isAdmin = user?.role === "admin";

  function toggleTheme() {
    const next = dark ? "light" : "dark";
    setTheme(next);
    setDark(!dark);
  }

  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50 print:hidden">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <img src="https://media.base44.com/images/public/6a049f1fdb040b9d18c5bf50/62006a35d_AllessasBoatClinic-BG.jpg" alt="Alessa's Boat Clinic" className="h-10 w-auto rounded-xl object-cover" />
          <span className="font-bold text-base text-foreground tracking-tight">
            Boat Clinic Invoices
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
            <Ship className="h-4 w-4" />
            Owners
          </Link>
<Link
            to="/reports"
            className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
              location.pathname === "/reports"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Reports
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
          {isAdmin && (
            <Link
              to="/users"
              className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                location.pathname === "/users"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <Users className="h-4 w-4" />
              Users
            </Link>
          )}
          <button
            onClick={toggleTheme}
            className="ml-1 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={() => logout()}
            className="ml-1 p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}