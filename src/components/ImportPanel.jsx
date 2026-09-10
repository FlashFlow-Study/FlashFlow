import React, { useState, useRef } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import { parseSet, FORMAT_LABEL } from "@/lib/setFormats";

const FORMATS = ["csv", "json", "tab"];

export default function ImportPanel({ onParsed, onError }) {
  const [format, setFormat] = useState("csv");
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result || ""));
    reader.onerror = () => onError?.("Couldn't read that file.");
    reader.readAsText(file);
  };

  const parse = () => {
    if (!text.trim()) {
      onError?.("Paste text or upload a file first.");
      return;
    }
    try {
      const result = parseSet(text, format);
      if (!result.cards || !result.cards.length) {
        onError?.("No cards found. Check the format and try again.");
        return;
      }
      onParsed(result);
    } catch (err) {
      onError?.("Couldn't parse that file: " + (err.message || "invalid format"));
    }
  };

  return (
    <div className="p-6 border border-slate-200 bg-card rounded-md">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Format</p>
      <div className="flex gap-2 mb-5">
        {FORMATS.map((f) => (
          <button
            key={f}
            onClick={() => setFormat(f)}
            className={`px-3.5 py-2 font-mono text-[11px] uppercase tracking-widest border rounded-md transition-colors ${
              format === f
                ? "border-primary text-primary"
                : "border-slate-200 text-muted-foreground hover:text-foreground"
            }`}
          >
            {FORMAT_LABEL[f]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Paste text
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder={
              format === "json"
                ? '{ "title": "...", "cards": [{ "front": "...", "back": "..." }] }'
                : format === "tab"
                ? "term\tdefinition"
                : "front,back"
            }
            className="w-full px-4 py-3 bg-background border border-slate-200 font-body text-sm focus:outline-none focus:border-primary rounded-md resize-none"
          />
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Upload a file
          </p>
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full h-[calc(100%-1.75rem)] min-h-[8rem] border border-dashed border-slate-200 rounded-md flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors p-4"
          >
            {fileName ? (
              <>
                <FileText className="w-6 h-6" />
                <span className="font-mono text-xs">{fileName}</span>
              </>
            ) : (
              <>
                <Upload className="w-6 h-6" />
                <span className="font-mono text-xs uppercase tracking-widest">Choose file</span>
              </>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.json,.txt,.tsv,text/plain,application/json"
            onChange={handleFile}
            className="hidden"
          />
        </div>
      </div>

      <button
        onClick={parse}
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity rounded-md"
      >
        <Loader2 className="w-4 h-4 hidden" />
        Preview cards
      </button>
      <p className="mt-3 font-mono text-[11px] text-muted-foreground">
        {format === "csv" && "Two columns: front, back. A header row is optional."}
        {format === "json" && "A deck object with a cards array, or an array of {front, back}."}
        {format === "tab" && "One card per line, term and definition separated by a tab."}
      </p>
    </div>
  );
}