import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wrench, Mail, Clock, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useSeo } from "@/lib/useSeo";

export default function Maintenance({ record: initialRecord }) {
  useSeo(
    "FlashFlow is under maintenance",
    "FlashFlow is temporarily unavailable while we make improvements. We'll be back shortly."
  );
  const navigate = useNavigate();
  const [record, setRecord] = useState(initialRecord || null);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const items = await base44.entities.MaintenanceMode.list(undefined, 1);
        const rec = Array.isArray(items) ? items[0] : null;
        if (cancelled) return;
        if (!rec || !rec.enabled) {
          // Maintenance has ended — send the visitor back into the app.
          navigate("/", { replace: true });
          return;
        }
        setRecord(rec);
      } catch {
        /* keep showing the maintenance page on polling errors */
      }
    };
    // Poll once on mount (covers the /maintenance route with no initial record),
    // then every 60 seconds so the page refreshes automatically.
    tick();
    const id = setInterval(tick, 60000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [navigate]);

  const message = (record?.message || "").trim();
  const estimatedReturn = (record?.estimated_return || "").trim();

  return (
    <div className="min-h-[calc(100dvh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="border border-border bg-card rounded-2xl p-8 md:p-10 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5 text-primary" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Maintenance
            </span>
          </div>

          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground tracking-tight leading-[1.05]">
            FlashFlow is getting some work done
          </h1>
          <p className="mt-4 font-body text-sm md:text-[15px] text-muted-foreground leading-relaxed">
            FlashFlow is temporarily unavailable while we make a few improvements. The site
            will be back shortly — thanks for your patience while we tidy up.
          </p>

          {message && (
            <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/15">
              <p className="font-body text-sm text-foreground leading-relaxed whitespace-pre-line">
                {message}
              </p>
            </div>
          )}

          {estimatedReturn && (
            <div className="mt-4 flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="font-body text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Estimated return:</span>{" "}
                {estimatedReturn}
              </p>
            </div>
          )}

          <div className="mt-6 flex items-start gap-2.5">
            <Mail className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="font-body text-sm text-muted-foreground">
              Need help? Email{" "}
              <a
                href="mailto:support@flashflowstudy.com"
                className="text-primary font-medium hover:underline"
              >
                support@flashflowstudy.com
              </a>
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              This page refreshes automatically every 60 seconds
            </p>
          </div>
        </div>

        <p className="mt-6 text-center font-display text-lg font-bold text-foreground tracking-tight">
          FlashFlow
        </p>
      </div>
    </div>
  );
}