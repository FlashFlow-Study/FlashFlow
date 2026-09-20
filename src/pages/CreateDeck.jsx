import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Trash2, Sparkles, Loader2, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import ImportPanel from "@/components/ImportPanel";
import SpecialCharToolbar from "@/components/SpecialCharToolbar";
import TagSuggestions from "@/components/TagSuggestions";
import { suggestTags } from "@/lib/suggestTags";

export default function CreateDeck() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const classroomId = params.get("classroom_id") || "";
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState(classroomId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [tags, setTags] = useState("");
  const [cards, setCards] = useState([{ front: "", back: "" }]);
  const [notes, setNotes] = useState("");
  const [mode, setMode] = useState(
    params.get("ai") === "1" ? "ai" : params.get("import") === "1" ? "import" : "manual"
  );
  const [count, setCount] = useState(12);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isTwoLanguages, setIsTwoLanguages] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState("");
  const [folders, setFolders] = useState([]);
  const activeInputRef = React.useRef(null);

  const suggestions = useMemo(
    () => suggestTags(cards, title, description),
    [cards, title, description]
  );
  const currentTags = tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
  const addSuggestedTag = (t) => {
    const list = tags.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
    if (!list.includes(t.toLowerCase())) setTags([...list, t.toLowerCase()].join(", "));
  };

  useEffect(() => {
    if (user?.is_teacher) {
      base44.entities.Classroom.list("-created_date", 100)
        .then((list) => setClassrooms(list.filter((c) => c.created_by_id === user.id)))
        .catch(() => {});
    }
    base44.entities.Folder.list("-created_date", 100)
      .then((list) => setFolders(list))
      .catch(() => {});
  }, [user?.id]);

  const handleImport = (result) => {
    if (result.title) setTitle(result.title);
    if (result.description !== undefined) setDescription(result.description || "");
    if (result.is_public !== undefined) setIsPublic(!!result.is_public);
    if (result.tags) setTags(Array.isArray(result.tags) ? result.tags.join(", ") : "");
    setCards(result.cards.map((c) => ({ front: c.front, back: c.back })));
    setMode("manual");
  };

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
      let classroomMembers = [];
      let classroomName = "";
      if (selectedClassroom) {
        const classroom = classrooms.find((c) => c.id === selectedClassroom);
        classroomName = classroom?.name || "";
        const memberships = await base44.entities.ClassroomMembership.filter({
          classroom_id: selectedClassroom,
          status: "joined",
        });
        classroomMembers = memberships.map((m) => m.user_id).filter(Boolean);
      }
      const deck = await base44.entities.Deck.create({
        title: title.trim(),
        description: description.trim(),
        is_public: selectedClassroom ? false : isPublic,
        tags: tags
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
        classroom_id: selectedClassroom || undefined,
        classroom_name: classroomName,
        classroom_members: classroomMembers,
        is_two_languages: isTwoLanguages,
        folder_id: selectedFolder || undefined,
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
          <button
            onClick={() => setMode("import")}
            className={`px-4 py-2 font-mono text-xs uppercase tracking-widest border transition-colors ${
              mode === "import"
                ? "border-primary text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <Upload className="w-3.5 h-3.5 inline mr-1.5" /> Import
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
              <TagSuggestions suggestions={suggestions} currentTags={currentTags} onAdd={addSuggestedTag} />
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
          {classrooms.length > 0 && (
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Classroom</label>
              <select
                value={selectedClassroom}
                onChange={(e) => setSelectedClassroom(e.target.value)}
                className="w-full mt-1 px-4 py-3 bg-card border border-border font-body text-sm focus:outline-none focus:border-primary rounded-md"
              >
                <option value="">None — personal deck</option>
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {selectedClassroom && (
                <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
                  This deck will be private — only class members can access it.
                </p>
              )}
            </div>
          )}
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

        {/* AI mode */}
        {mode === "ai" ? (
          <div className="mt-8 p-6 border border-slate-200 bg-card rounded-md">
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
        ) : mode === "import" ? (
          <div className="mt-8">
            <ImportPanel onParsed={handleImport} onError={setError} />
            <p className="mt-4 font-mono text-[11px] text-muted-foreground">
              After importing, review and edit the cards below before saving.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Cards ({cards.length})
              </span>
            </div>
            <div className="p-3 border border-blue-100 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 rounded-md">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                Special characters — click to insert into the active field
              </p>
              <SpecialCharToolbar activeInputRef={activeInputRef} />
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
                      onFocus={(e) => { activeInputRef.current = { element: e.target, onChange: (v) => updateCard(i, "front", v) }; }}
                      placeholder="Front (term)"
                      className="px-3 py-2.5 bg-background border border-border font-body text-sm focus:outline-none focus:border-primary"
                    />
                    <input
                      value={card.back}
                      onChange={(e) => updateCard(i, "back", e.target.value)}
                      onFocus={(e) => { activeInputRef.current = { element: e.target, onChange: (v) => updateCard(i, "back", v) }; }}
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