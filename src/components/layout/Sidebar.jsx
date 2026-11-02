import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, Plus, Layers, FolderOpen, School, Zap, GraduationCap, Compass, ShieldCheck, LogIn, Menu } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import BetaBadge from "@/components/BetaBadge";

const LOGO_URL =
  "https://base44.app/api/apps/6aa2f176f13d78a264f4a844/files/mp/public/6aa2f176f13d78a264f4a844/de1e4bac2_flashflow_logo.png";

function NavRow({ to, icon: Icon, label, active, trailing, collapsed }) {
  return (
    <Link
      to={to}
      title={collapsed ? label : undefined}
      className={`flex items-center rounded-md font-mono text-[11px] uppercase tracking-widest transition-colors ${
        collapsed ? "justify-center py-2.5" : "gap-3 px-3 py-2.5"
      } ${
        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {!collapsed && <span className="flex-1 truncate">{label}</span>}
      {!collapsed && trailing}
    </Link>
  );
}

export default function Sidebar({ q, onSearch, initial, collapsed, onToggle }) {
  const { user } = useAuth();
  const location = useLocation();
  const path = location.pathname;
  const isAdmin = user?.role === "admin";

  return (
    <aside
      className={`hidden md:flex md:flex-col shrink-0 sticky top-0 h-screen border-r border-slate-200 dark:border-slate-800 bg-card transition-[width] duration-200 ${
        collapsed ? "w-16" : "w-60 lg:w-64"
      }`}
    >
      <div className="px-2 py-3 border-b border-slate-200 dark:border-slate-800">
        <div className={`flex items-center ${collapsed ? "flex-col gap-3" : "justify-between gap-2"}`}>
          <button
            onClick={onToggle}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="p-2 rounded-md text-muted-foreground hover:text-primary hover:bg-secondary transition-colors shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>
          {!collapsed && (
            <Link to="/" className="inline-flex items-center gap-2 font-display text-xl font-bold text-foreground tracking-tight truncate">
              <img src={LOGO_URL} alt="FlashFlow logo" className="w-9 h-9 rounded-md shrink-0" />
              FlashFlow
            </Link>
          )}
        </div>

        {collapsed ? (
          <Link to="/" className="mt-1 flex justify-center">
            <img src={LOGO_URL} alt="FlashFlow logo" className="w-9 h-9 rounded-md" />
          </Link>
        ) : (
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={q}
              onChange={onSearch}
              placeholder="Search decks…"
              className="w-full pl-9 pr-3 py-2 bg-background border border-slate-200 dark:border-slate-800 font-body text-sm focus:outline-none focus:border-primary rounded-md"
            />
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        <NavRow to="/" icon={Layers} label="Decks" active={path === "/"} collapsed={collapsed} />
        {user && <NavRow to="/my-decks" icon={FolderOpen} label="My Decks" active={path === "/my-decks"} collapsed={collapsed} />}
        {user && (
          <NavRow to="/classrooms" icon={School} label="Classes" active={path.startsWith("/classroom")} collapsed={collapsed} />
        )}
        {user?.is_teacher && (
          <NavRow to="/teacher" icon={GraduationCap} label="Teach" active={path === "/teacher"} collapsed={collapsed} />
        )}
        {user && (
          <NavRow to="/discover" icon={Compass} label="Discover" active={path === "/discover"} collapsed={collapsed} />
        )}
        <NavRow
          to="/live"
          icon={Zap}
          label="Live"
          active={path.startsWith("/live")}
          trailing={<BetaBadge />}
          collapsed={collapsed}
        />
        {isAdmin && (
          <NavRow to="/admin" icon={ShieldCheck} label="Admin" active={path.startsWith("/admin")} collapsed={collapsed} />
        )}
      </nav>

      <div className={`border-t border-slate-200 dark:border-slate-800 space-y-2 ${collapsed ? "px-2 py-3" : "px-3 py-3"}`}>
        <Link
          to="/create"
          title={collapsed ? "Create set" : undefined}
          className={`flex items-center justify-center bg-primary text-primary-foreground font-mono text-[11px] uppercase tracking-widest hover:opacity-90 transition-opacity rounded-md ${
            collapsed ? "p-2.5" : "gap-2 px-3 py-2.5"
          }`}
        >
          <Plus className="w-4 h-4" />
          {!collapsed && "Create set"}
        </Link>

        {user ? (
          <Link
            to="/account"
            title={collapsed ? user?.display_name || user?.full_name || "Account" : undefined}
            className={`flex items-center border rounded-md transition-colors ${
              collapsed ? "justify-center py-1.5 px-1" : "gap-2 px-2.5 py-2"
            } ${path === "/account" ? "border-primary" : "border-slate-200 dark:border-slate-800 hover:border-primary"}`}
          >
            <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display text-sm font-bold shrink-0">
              {initial}
            </span>
            {!collapsed && (
              <span className="font-mono text-xs text-foreground truncate">
                {user?.display_name || user?.full_name || "Account"}
              </span>
            )}
          </Link>
        ) : (
          <Link
            to="/login"
            title={collapsed ? "Sign in" : undefined}
            className={`flex items-center justify-center border border-slate-200 dark:border-slate-800 font-mono text-[11px] uppercase tracking-widest text-foreground hover:border-primary hover:text-primary transition-colors rounded-md ${
              collapsed ? "p-2.5" : "gap-1.5 px-3 py-2"
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            {!collapsed && "Sign in"}
          </Link>
        )}
      </div>
    </aside>
  );
}