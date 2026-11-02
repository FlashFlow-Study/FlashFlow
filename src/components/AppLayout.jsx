import React from "react";
import { Link, Outlet, useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import BetaBadge from "@/components/BetaBadge";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";

export default function AppLayout() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const q = params.get("q") || "";
  const isAdmin = user?.role === "admin";

  // Sidebar collapse state, remembered across visits.
  const [collapsed, setCollapsed] = React.useState(() => {
    try { return localStorage.getItem("ff.sidebar.collapsed") === "1"; } catch { return false; }
  });
  const toggleSidebar = () =>
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem("ff.sidebar.collapsed", next ? "1" : "0"); } catch { /* ignore */ }
      return next;
    });

  const onSearch = (e) => {
    const val = e.target.value;
    navigate(val ? `/search?q=${encodeURIComponent(val)}` : "/search", { replace: true });
  };

  const initial = (user?.display_name || user?.full_name || user?.email || "?").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar q={q} onSearch={onSearch} initial={initial} collapsed={collapsed} onToggle={toggleSidebar} />

      <div className="flex-1 min-w-0 flex flex-col">
        <MobileNav user={user} initial={initial} path={location.pathname} />

        <main className="flex-1 pb-20 md:pb-0">
          <Outlet />
        </main>

        <footer className="border-t border-slate-200 bg-card pb-16 md:pb-0">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-5 flex flex-wrap items-center justify-between gap-y-2 gap-x-5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              © {new Date().getFullYear()} FlashFlow
            </span>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <Link to="/about" className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                About
              </Link>
              <Link to="/contact" className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </Link>
              <Link to="/blog" className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                Blog
              </Link>
              <Link to="/live" className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
                Live <BetaBadge className="ml-1" />
              </Link>
              <Link to="/privacy" className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link to="/terms" className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                Terms
              </Link>
              {isAdmin && (
                <Link to="/admin" className="font-mono text-[10px] uppercase tracking-widest text-primary hover:underline">
                  Admin
                </Link>
              )}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}