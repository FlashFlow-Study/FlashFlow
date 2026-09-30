import React, { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Small per-side photo control for card editors. Uploads via the platform's
// client-side public upload and reports the resulting URL to the parent.
export default function CardImageUpload({ value, onChange, onRemove, label = "photo" }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      onChange(file_url);
    } catch {
      /* ignore */
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  if (value) {
    return (
      <div className="relative inline-block">
        <img
          src={value}
          alt={label}
          className="h-10 w-10 object-cover rounded border border-border"
        />
        <button
          type="button"
          onClick={onRemove}
          title="Remove photo"
          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      </div>
    );
  }

  return (
    <label
      className={`inline-flex items-center gap-1 px-2 py-1 border border-border rounded font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer ${
        uploading ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImagePlus className="w-3 h-3" />}
      {uploading ? "Uploading" : "Photo"}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </label>
  );
}