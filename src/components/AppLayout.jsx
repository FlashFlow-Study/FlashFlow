import React from "react";
import { Link, Outlet, useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { Search, Plus, Layers, Library as LibraryIcon, User, Info, Mail } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

function NavItem({ to, icon: Icon, label, active }) {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center justify-center gap-1 py-2.5 font-mono text-[10px] uppercase tracking-widest transition-colors ${
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </Link>
  );
}

export default function AppLayout() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const q = params.get("q") || "";

  const onSearch = (e) => {
    const val = e.target.value;
    navigate(val ? `/?q=${encodeURIComponent(val)}` : "/", { replace: true });
  };

  const initial = (user?.full_name || user?.email || "?").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-30 bg-card/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center gap-3 md:gap-5">
          <Link to="/" className="font-display text-xl md:text-2xl font-bold text-foreground tracking-tight">
            FlashFlow
          </Link>
          <div className="hidden md:flex flex-1 max-w-md ml-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={q}
                onChange={onSearch}
                placeholder="Search decks…"
                className="w-full pl-9 pr-3 py-2 bg-background border border-slate-200 font-body text-sm focus:outline-none focus:border-primary rounded-md"
              />
            </div>
          </div>
          <div className="flex-1 md:flex-none" />
          <Link
            to="/about"
            className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 font-mono text-[11px] uppercase tracking-widest text-foreground hover:border-primary hover:text-primary transition-colors rounded-md"
          >
            <Info className="w-3.5 h-3.5" /> About
          </Link>
          <Link
            to="/contact"
            className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 font-mono text-[11px] uppercase tracking-widest text-foreground hover:border-primary hover:text-primary transition-colors rounded-md"
          >
            <Mail className="w-3.5 h-3.5" /> Contact
          </Link>
          <Link
            to="/create?import=1"
            className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 font-mono text-[11px] uppercase tracking-widest text-foreground hover:border-primary hover:text-primary transition-colors rounded-md"
          >
            <Plus className="w-3.5 h-3.5" /> Import Set
          </Link>
          {user ? (
            <Link
              to="/account"
              className={`inline-flex items-center gap-2 px-2.5 py-1.5 border rounded-md transition-colors ${
                location.pathname === "/account" ? "border-primary" : "border-slate-200 hover:border-primary"
              }`}
            >
              <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display text-sm font-bold">
                {initial}
              </span>
              <span className="hidden md:inline font-mono text-xs text-foreground">
                {user?.full_name || "Account"}
              </span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground font-mono text-[11px] uppercase tracking-widest hover:opacity-90 transition-opacity rounded-md"
            >
              <User className="w-3.5 h-3.5" /> Sign in
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-card pb-16 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-5 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            © {new Date().getFullYear()} FlashFlow
          </span>
          <div className="flex items-center gap-5">
            <Link to="/about" className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <Link to="/contact" className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </footer>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-card border-t border-slate-200">
        <div className="grid grid-cols-4">
          <NavItem to="/" icon={Layers} label="Decks" active={location.pathname === "/"} />
          <NavItem to="/#library" icon={LibraryIcon} label="Library" active={location.hash === "#library"} />
          <NavItem to="/create?import=1" icon={Plus} label="Import" active={location.pathname === "/create"} />
          <NavItem to={user ? "/account" : "/login"} icon={User} label={user ? "Profile" : "Sign in"} active={location.pathname === "/account"} />
        </div>
      </nav>
    </div>
  );
}