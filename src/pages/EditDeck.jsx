import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function EditDeck() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [tags, setTags] = useState("");
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isTwoLanguages, setIsTwoLanguages] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState("");
  const [folders, setFolders] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const d = await base44.entities.Deck.get(id);
        setTitle(d.title || "");
        setDescription(d.description || "");
        setIsPublic(!!d.is_public);
        setTags((d.tags || []).join(", "));
        setIsTwoLanguages(!!d.is_two_languages);
        setSelectedFolder(d.folder_id || "");
        const [c, folderList] = await Promise.all([
          base44.entities.Card.filter({ deck_id: id }, "order", 200),
          base44.entities.Folder.list("-created_date", 100).catch(() => []),
        ]);
        setCards(c.map((card) => ({ id: card.id, front: card.front, back: card.back, order: card.order })));
        setFolders(folderList);
      } catch {
        setError("Deck not found or you don't have permission to edit it.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const updateCard = (i, field, val) => {
    setCards((c) => c.map((card, idx) => (idx === i ? { ...card, [field]: val } : card)));
  };
  const addCard = () => setCards((c) => [...c, { front: "", back: "" }]);
  const removeCard = (i) => setCards((c) => c.filter((_, idx) => idx !== i));

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
      await base44.entities.Deck.update(id, {
        title: title.trim(),
        description: description.trim(),
        is_public: isPublic,
        tags: tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean),
        is_two_languages: isTwoLanguages,
        folder_id: selectedFolder || undefined,
      });
      await base44.entities.Card.deleteMany({ deck_id: id });
      await base44.entities.Card.bulkCreate(
        valid.map((c, i) => ({ deck_id: id, front: c.front.trim(), back: c.back.trim(), order: i }))
      );
      navigate(`/deck/${id}`);
    } catch (e) {
      setError(e.response?.data?.error || "Couldn't save your changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Link to={`/deck/${id}`} className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
        ← Back to deck
      </Link>
      <h1 className="font-display text-4xl md:text-5xl text-foreground mt-6 tracking-tight">Edit deck</h1>

      <div className="mt-8 space-y-4">
        <div>
          <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full mt-1 px-4 py-3 bg-card border border-border font-body text-sm focus:outline-none focus:border-primary rounded-md shadow-sm"
          />
        </div>
        <div>
          <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full mt-1 px-4 py-3 bg-card border border-border font-body text-sm focus:outline-none focus:border-primary resize-none rounded-md shadow-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Tags</label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="science, biology"
              className="w-full mt-1 px-4 py-3 bg-card border border-border font-body text-sm focus:outline-none focus:border-primary rounded-md shadow-sm"
            />
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Privacy</label>
            <button
              onClick={() => setIsPublic((p) => !p)}
              className="w-full mt-1 px-4 py-3 bg-card border border-border font-mono text-xs uppercase tracking-widest flex items-center justify-between hover:border-primary transition-colors rounded-md shadow-sm"
            >
              <span className={isPublic ? "text-primary" : "text-muted-foreground"}>
                {isPublic ? "Public" : "Private"}
              </span>
              <span className={`w-10 h-5 rounded-full relative transition-colors ${isPublic ? "bg-primary" : "bg-border"}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${isPublic ? "left-5" : "left-0.5"}`} />
              </span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Folder</label>
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="w-full mt-1 px-4 py-3 bg-card border border-border font-body text-sm focus:outline-none focus:border-primary rounded-md"
            >
              <option value="">No folder</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Two languages?</label>
            <button
              onClick={() => setIsTwoLanguages((v) => !v)}
              className="w-full mt-1 px-4 py-3 bg-card border border-border font-mono text-xs uppercase tracking-widest flex items-center justify-between hover:border-primary transition-colors rounded-md"
            >
              <span className={isTwoLanguages ? "text-primary" : "text-muted-foreground"}>
                {isTwoLanguages ? "Yes" : "No"}
              </span>
              <span className={`w-10 h-5 rounded-full relative transition-colors ${isTwoLanguages ? "bg-primary" : "bg-border"}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${isTwoLanguages ? "left-5" : "left-0.5"}`} />
              </span>
            </button>
            <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
              If yes, Type mode requires exact spelling.
            </p>
          </div>
        </div>
      </div>

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
            className="p-4 border border-border bg-card rounded-md shadow-sm"
          >
            <div className="flex items-start gap-3">
              <span className="font-mono text-xs text-muted-foreground pt-2">{i + 1}</span>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  value={card.front}
                  onChange={(e) => updateCard(i, "front", e.target.value)}
                  placeholder="Front (term)"
                  className="px-3 py-2.5 bg-background border border-border font-body text-sm focus:outline-none focus:border-primary rounded-md"
                />
                <input
                  value={card.back}
                  onChange={(e) => updateCard(i, "back", e.target.value)}
                  placeholder="Back (definition)"
                  className="px-3 py-2.5 bg-background border border-border font-body text-sm focus:outline-none focus:border-primary rounded-md"
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
          className="w-full p-3 border border-dashed border-border font-mono text-xs uppercase tracking-widest text-muted-foreground hover:border-primary hover:text-primary transition-colors rounded-md"
        >
          <Plus className="w-4 h-4 inline mr-1.5" /> Add card
        </button>
      </div>

      {error && <p className="mt-6 font-body text-sm text-destructive">{error}</p>}

      <button
        onClick={save}
        disabled={saving}
        className="mt-8 w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest disabled:opacity-40 hover:opacity-90 transition-opacity rounded-md shadow-md shadow-primary/20"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}