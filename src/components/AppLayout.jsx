import React from "react";
import { Link, Outlet, useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { Search, Plus, Layers, User, FolderOpen, School, Zap, GraduationCap } from "lucide-react";
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
  const isAdmin = user?.role === "admin";

  const onSearch = (e) => {
    const val = e.target.value;
    navigate(val ? `/search?q=${encodeURIComponent(val)}` : "/search", { replace: true });
  };

  const initial = (user?.display_name || user?.full_name || user?.email || "?").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-30 bg-card/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center gap-3 md:gap-5">
          <Link to="/" className="inline-flex items-center gap-2 font-display text-xl md:text-2xl font-bold text-foreground tracking-tight">
            <img src="https://base44.app/api/apps/6aa2f176f13d78a264f4a844/files/mp/public/6aa2f176f13d78a264f4a844/de1e4bac2_flashflow_logo.png" alt="FlashFlow logo" className="w-9 h-9 md:w-10 md:h-10 rounded-md" />
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
          {user && (
            <Link
              to="/my-decks"
              className={`hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 border font-mono text-[11px] uppercase tracking-widest transition-colors rounded-md ${
                location.pathname === "/my-decks"
                  ? "border-primary text-primary"
                  : "border-blue-200 dark:border-blue-800 text-foreground hover:border-primary hover:text-primary"
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" /> My Decks
            </Link>
          )}
          {user && (
            <Link
              to="/classrooms"
              className={`hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 border font-mono text-[11px] uppercase tracking-widest transition-colors rounded-md ${
                location.pathname.startsWith("/classroom")
                  ? "border-primary text-primary"
                  : "border-blue-200 dark:border-blue-800 text-foreground hover:border-primary hover:text-primary"
              }`}
            >
              <School className="w-3.5 h-3.5" /> Classes
            </Link>
          )}
          {user?.is_teacher && (
            <Link
              to="/teacher"
              className={`hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 border font-mono text-[11px] uppercase tracking-widest transition-colors rounded-md ${
                location.pathname === "/teacher"
                  ? "border-primary text-primary"
                  : "border-blue-200 dark:border-blue-800 text-foreground hover:border-primary hover:text-primary"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" /> Teach
            </Link>
          )}
          <Link
            to="/live"
            className={`hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 border font-mono text-[11px] uppercase tracking-widest transition-colors rounded-md ${
              location.pathname.startsWith("/live")
                ? "border-primary text-primary"
                : "border-blue-200 dark:border-blue-800 text-foreground hover:border-primary hover:text-primary"
            }`}
          >
            <Zap className="w-3.5 h-3.5" /> Live
          </Link>
          <Link
            to="/create?import=1"
            className="hidden md:inline-flex items-center justify-center px-3 py-2 border border-blue-200 dark:border-blue-800 text-primary hover:border-primary hover:text-primary transition-colors rounded-md"
            title="Import set"
          >
            <Plus className="w-4 h-4" />
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
                {user?.display_name || user?.full_name || "Account"}
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
            <Link to="/live" className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
              Live
            </Link>
            <Link to="/privacy" className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </Link>
            {isAdmin && (
              <Link to="/admin/data-privacy" className="font-mono text-[10px] uppercase tracking-widest text-primary hover:underline">
                Data Privacy
              </Link>
            )}
          </div>
        </div>
      </footer>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-card border-t border-blue-100 dark:border-blue-900/50">
        <div className="grid grid-cols-5">
          <NavItem to="/" icon={Layers} label="Decks" active={location.pathname === "/"} />
          <NavItem to="/search" icon={Search} label="Search" active={location.pathname === "/search"} />
          <NavItem to="/classrooms" icon={School} label="Classes" active={location.pathname.startsWith("/classroom")} />
          <NavItem to={user ? "/my-decks" : "/create?import=1"} icon={user ? FolderOpen : Plus} label={user ? "My Decks" : "Import"} active={location.pathname === "/my-decks" || location.pathname === "/create"} />
          <NavItem to={user ? "/account" : "/login"} icon={User} label={user ? "Profile" : "Sign in"} active={location.pathname === "/account"} />
        </div>
      </nav>
    </div>
  );
}