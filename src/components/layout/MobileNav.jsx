import React from "react";
import { Link } from "react-router-dom";
import { Search, Plus, Layers, User, FolderOpen, School } from "lucide-react";

const LOGO_URL =
  "https://base44.app/api/apps/6aa2f176f13d78a264f4a844/files/mp/public/6aa2f176f13d78a264f4a844/de1e4bac2_flashflow_logo.png";

function TabItem({ to, icon: Icon, label, active }) {
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

/**
 * Mobile-only chrome: compact top bar with the logo and account entry, plus
 * the fixed bottom tab bar. The desktop left sidebar handles everything at md
 * and above.
 */
export default function MobileNav({ user, initial, path }) {
  return (
    <>
      <header className="md:hidden sticky top-0 z-30 bg-card/90 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <div className="px-4 h-14 flex items-center justify-between gap-3">
          <Link to="/" className="inline-flex items-center gap-2 font-display text-lg font-bold text-foreground tracking-tight">
            <img src={LOGO_URL} alt="FlashFlow logo" className="w-8 h-8 rounded-md" />
            FlashFlow
          </Link>
          <Link
            to={user ? "/account" : "/login"}
            className={`inline-flex items-center gap-2 px-2.5 py-1.5 border rounded-md transition-colors ${
              path === "/account" ? "border-primary" : "border-slate-200 dark:border-slate-800"
            }`}
          >
            <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display text-sm font-bold">
              {initial}
            </span>
            {!user && <span className="font-mono text-[11px] uppercase tracking-widest">Sign in</span>}
          </Link>
        </div>
      </header>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-card border-t border-blue-100 dark:border-blue-900/50">
        <div className="grid grid-cols-5">
          <TabItem to="/" icon={Layers} label="Decks" active={path === "/"} />
          <TabItem to="/search" icon={Search} label="Search" active={path === "/search"} />
          <TabItem to="/classrooms" icon={School} label="Classes" active={path.startsWith("/classroom")} />
          <TabItem
            to={user ? "/my-decks" : "/create?import=1"}
            icon={user ? FolderOpen : Plus}
            label={user ? "My Decks" : "Import"}
            active={path === "/my-decks" || path === "/create"}
          />
          <TabItem to={user ? "/account" : "/login"} icon={User} label={user ? "Profile" : "Sign in"} active={path === "/account"} />
        </div>
      </nav>
    </>
  );
}