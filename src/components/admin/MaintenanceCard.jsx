import React, { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Wrench } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "@/components/ui/use-toast";

export default function MaintenanceCard() {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("");
  const [estimatedReturn, setEstimatedReturn] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const items = await base44.entities.MaintenanceMode.list(undefined, 1);
        const rec = Array.isArray(items) ? items[0] : null;
        setRecord(rec);
        setEnabled(!!rec?.enabled);
        setMessage(rec?.message || "");
        setEstimatedReturn(rec?.estimated_return || "");
      } catch {
        /* no record yet — defaults are fine */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        enabled,
        message: message.trim(),
        estimated_return: estimatedReturn.trim(),
      };
      let result;
      if (record?.id) {
        result = await base44.entities.MaintenanceMode.update(record.id, payload);
      } else {
        result = await base44.entities.MaintenanceMode.create(payload);
      }
      setRecord(result);
      setEnabled(!!result?.enabled);
      toast({
        title: enabled ? "Maintenance mode enabled" : "Maintenance mode disabled",
        description: enabled
          ? "Visitors now see the maintenance page."
          : "The site is live again.",
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Failed to update maintenance mode",
        description: e?.message || "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const dirty =
    enabled !== !!record?.enabled ||
    message.trim() !== (record?.message || "").trim() ||
    estimatedReturn.trim() !== (record?.estimated_return || "").trim();

  return (
    <div className="p-6 border border-border bg-card rounded-xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Wrench className="w-5 h-5 text-primary" />
          </span>
          <div>
            <h2 className="font-display text-xl text-foreground tracking-tight">Maintenance mode</h2>
            <p className="mt-1 font-body text-sm text-muted-foreground">
              Take the site offline temporarily. Visitors see a friendly maintenance page; admins
              can still get in to switch it off.
            </p>
          </div>
        </div>
        {loading ? (
          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin shrink-0" />
        ) : (
          <span
            className={`shrink-0 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-widest ${
              enabled
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {enabled ? "Maintenance" : "Live"}
          </span>
        )}
      </div>

      <div className="mt-6 space-y-5">
        <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-muted/40 border border-border">
          <div>
            <p className="font-body text-sm font-medium text-foreground">Enable maintenance mode</p>
            <p className="font-body text-xs text-muted-foreground mt-0.5">
              {enabled
                ? "The site is currently in maintenance."
                : "The site is currently live."}
            </p>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={setEnabled}
            disabled={loading || saving}
            aria-label="Toggle maintenance mode"
          />
        </div>

        <div className="space-y-1.5">
          <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Custom message (optional)
          </label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. We're upgrading our study engine. Back soon!"
            rows={3}
            disabled={loading || saving}
          />
        </div>

        <div className="space-y-1.5">
          <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Estimated return (optional)
          </label>
          <Input
            value={estimatedReturn}
            onChange={(e) => setEstimatedReturn(e.target.value)}
            placeholder="e.g. within 2 hours"
            disabled={loading || saving}
          />
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={loading || saving || !dirty}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : (
              "Save"
            )}
          </Button>
          {dirty && (
            <span className="font-body text-xs text-muted-foreground">Unsaved changes</span>
          )}
        </div>
      </div>
    </div>
  );
}