import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Trash2, Sparkles, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function CreateDeck() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [tags, setTags] = useState("");
  const [cards, setCards] = useState([{ front: "", back: "" }]);
  const [notes, setNotes] = useState("");
  const [mode, setMode] = useState(params.get("ai") === "1" ? "ai" : "manual");
  const [count, setCount] = useState(12);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const updateCard = (i, field, val) => {
    setCards((c) => c.map((card, idx) => (idx === i ? { ...card, [field]: val } : card)));
  };
  const addCard = () => setCards((c) => [...c, { front: "", back: "" }]);
  const removeCard = (i) => setCards((c) => c.filter((_, idx) => idx !== i));

  const generate = async () => {
    setError("");
    setGenerating(true);
    try {
      const res = await base44.functions.invoke("generateCards", {
        notes,
        title,
        count,
      });
      const generated = res.data?.cards || [];
      if (!generated.length) {
        setError("Couldn't generate cards from those notes. Try adding more detail.");
      } else {
        setCards(generated.map((c) => ({ front: c.front, back: c.back })));
        setMode("manual");
      }
    } catch (e) {
      setError(e.response?.data?.error || "Generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const save = async () => {
    setError("");
    if (!title.trim()) {
      setError("Give your deck a title.");
      return;
    }
    const valid = cards.filter((c) => c.front.trim() && c.back.trim());
    if (!valid.length) {
      setError("Add at least one card with both a front and a back.");
      return;
    }
    setSaving(true);
    try {
      const deck = await base44.entities.Deck.create({
        title: title.trim(),
        description: description.trim(),
        is_public: isPublic,
        tags: tags
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
      });
      await base44.entities.Card.bulkCreate(
        valid.map((c, i) => ({
          deck_id: deck.id,
          front: c.front.trim(),
          back: c.back.trim(),
          order: i,
        }))
      );
      navigate(`/deck/${deck.id}`);
    } catch (e) {
      setError(e.response?.data?.error || "Couldn't save your deck.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/" className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
          ← Back
        </Link>
        <h1 className="font-display text-5xl text-foreground mt-6 tracking-tight">New deck</h1>

        {/* Mode switch */}
        <div className="flex gap-2 mt-8">
          <button
            onClick={() => setMode("manual")}
            className={`px-4 py-2 font-mono text-xs uppercase tracking-widest border transition-colors ${
              mode === "manual"
                ? "border-primary text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <Plus className="w-3.5 h-3.5 inline mr-1.5" /> Manual
          </button>
          <button
            onClick={() => setMode("ai")}
            className={`px-4 py-2 font-mono text-xs uppercase tracking-widest border transition-colors ${
              mode === "ai"
                ? "border-primary text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 inline mr-1.5" /> AI generate
          </button>
        </div>

        {/* Deck meta */}
        <div className="mt-8 space-y-4">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Biology — Cell Structure"
              className="w-full mt-1 px-4 py-3 bg-card border border-border font-body text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Optional"
              className="w-full mt-1 px-4 py-3 bg-card border border-border font-body text-sm focus:outline-none focus:border-primary resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Tags</label>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="science, biology"
                className="w-full mt-1 px-4 py-3 bg-card border border-border font-body text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Privacy</label>
              <button
                onClick={() => setIsPublic((p) => !p)}
                className="w-full mt-1 px-4 py-3 bg-card border border-border font-mono text-xs uppercase tracking-widest flex items-center justify-between hover:border-primary transition-colors"
              >
                <span className={isPublic ? "text-primary" : "text-muted-foreground"}>
                  {isPublic ? "Public" : "Private"}
                </span>
                <span className={`w-10 h-5 rounded-full relative transition-colors ${isPublic ? "bg-primary" : "bg-border"}`}>
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                      isPublic ? "left-5" : "left-0.5"
                    }`}
                  />
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* AI mode */}
        {mode === "ai" ? (
          <div className="mt-8 p-6 border border-border bg-card">
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Paste your study notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={8}
              placeholder="Paste notes, a chapter summary, or any study material…"
              className="w-full mt-2 px-4 py-3 bg-background border border-border font-body text-sm focus:outline-none focus:border-primary resize-none"
            />
            <div className="flex items-center justify-between mt-4">
              <label className="font-mono text-xs text-muted-foreground">
                Cards: <span className="text-foreground">{count}</span>
                <input
                  type="range"
                  min={4}
                  max={30}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="ml-3 accent-primary"
                />
              </label>
              <button
                onClick={generate}
                disabled={generating || notes.length < 10}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {generating ? "Generating…" : "Generate cards"}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Cards ({cards.length})
              </span>
            </div>
            {cards.map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="p-4 border border-border bg-card"
              >
                <div className="flex items-start gap-3">
                  <span className="font-mono text-xs text-muted-foreground pt-2">{i + 1}</span>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      value={card.front}
                      onChange={(e) => updateCard(i, "front", e.target.value)}
                      placeholder="Front (term)"
                      className="px-3 py-2.5 bg-background border border-border font-body text-sm focus:outline-none focus:border-primary"
                    />
                    <input
                      value={card.back}
                      onChange={(e) => updateCard(i, "back", e.target.value)}
                      placeholder="Back (definition)"
                      className="px-3 py-2.5 bg-background border border-border font-body text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <button
                    onClick={() => removeCard(i)}
                    disabled={cards.length === 1}
                    className="p-2 text-muted-foreground hover:text-destructive disabled:opacity-30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
            <button
              onClick={addCard}
              className="w-full p-3 border border-dashed border-border font-mono text-xs uppercase tracking-widest text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <Plus className="w-4 h-4 inline mr-1.5" /> Add card
            </button>
          </div>
        )}

        {error && <p className="mt-6 font-body text-sm text-destructive">{error}</p>}

        <button
          onClick={save}
          disabled={saving}
          className="mt-8 w-full px-6 py-3.5 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          {saving ? "Saving…" : "Save deck"}
        </button>
      </div>
    </div>
  );
}