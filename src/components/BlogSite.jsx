import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import RedirectToMainDomain from "@/components/RedirectToMainDomain";
import { mainUrl } from "@/lib/blogHost";

const LOGO =
  "https://base44.app/api/apps/6aa2f176f13d78a264f4a844/files/mp/public/6aa2f176f13d78a264f4a844/de1e4bac2_flashflow_logo.png";

// The blog subdomain shell: a lightweight header (logo → main domain, "Blog"
// label → the list) and legal footer, with "/" = post list and "/:id" = post.
// Any other path redirects to the main domain with the same path.
export default function BlogSite() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-30 bg-card/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center gap-3">
          <a
            href={mainUrl("/")}
            className="inline-flex items-center gap-2 font-display text-xl md:text-2xl font-bold text-foreground tracking-tight"
          >
            <img
              src={LOGO}
              alt="FlashFlow logo"
              className="w-9 h-9 md:w-10 md:h-10 rounded-md"
            />
            FlashFlow
          </a>
          <div className="flex-1" />
          <Link
            to="/"
            className="font-mono text-[11px] uppercase tracking-widest text-primary border border-blue-200 dark:border-blue-800 px-3.5 py-2 rounded-md"
          >
            Blog
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Blog />} />
          <Route path="/:id" element={<BlogPost />} />
          <Route path="*" element={<RedirectToMainDomain />} />
        </Routes>
      </main>

      <footer className="border-t border-slate-200 bg-card">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-5 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            © {new Date().getFullYear()} FlashFlow
          </span>
          <div className="flex items-center gap-5">
            <a href={mainUrl("/about")} className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
              About
            </a>
            <a href={mainUrl("/contact")} className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </a>
            <a href={mainUrl("/privacy")} className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href={mainUrl("/terms")} className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
              Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}