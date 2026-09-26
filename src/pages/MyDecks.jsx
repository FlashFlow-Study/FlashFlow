import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Upload, Loader2, BookOpen, FolderPlus, Folder, X, GripVertical } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import DeckCard from "@/components/DeckCard";

export default function MyDecks() {
  useSeo("FlashFlow - My Decks", "All of your created decks, managed into folders.");
  const { user } = useAuth();
  const [decks, setDecks] = useState([]);
  const [counts, setCounts] = useState({});
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [draggingId, setDraggingId] = useState(null);
  const [dragOver, setDragOver] = useState(null); // folder id | "unfiled" | null

  useEffect(() => {
    (async () => {
      try {
        const [all, folderList] = await Promise.all([
          base44.entities.Deck.list("-created_date", 200),
          base44.entities.Folder.list("-created_date", 100).catch(() => []),
        ]);
        const mine = all.filter((d) => d.created_by_id === user?.id);
        setDecks(mine);
        setFolders(folderList);
        const c = {};
        await Promise.all(
          mine.map(async (d) => {
            const list = await base44.entities.Card.filter({ deck_id: d.id }, undefined, 0);
            c[d.id] = list.length;
          })
        );
        setCounts(c);
      } catch {
        setDecks([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const f = await base44.entities.Folder.create({ name: newFolderName.trim() });
      setFolders((prev) => [f, ...prev]);
      setNewFolderName("");
      setCreatingFolder(false);
    } catch { /* ignore */ }
  };

  const deleteFolder = async (folderId) => {
    try {
      await base44.entities.Deck.updateMany(
        { folder_id: folderId, created_by_id: user.id },
        { $unset: { folder_id: "" } }
      );
      await base44.entities.Folder.delete(folderId);
      setFolders((prev) => prev.filter((f) => f.id !== folderId));
      setDecks((prev) => prev.map((d) => (d.folder_id === folderId ? { ...d, folder_id: undefined } : d)));
      if (activeFilter === folderId) setActiveFilter("all");
    } catch { /* ignore */ }
  };

  const moveDeck = async (deckId, folderId) => {
    try {
      await base44.entities.Deck.update(deckId, { folder_id: folderId || undefined });
      setDecks((prev) => prev.map((d) => (d.id === deckId ? { ...d, folder_id: folderId || undefined } : d)));
    } catch { /* ignore */ }
  };

  const onDropFolder = (e, folderId) => {
    e.preventDefault();
    const deckId = e.dataTransfer.getData("text/deckId");
    setDragOver(null);
    setDraggingId(null);
    if (deckId) moveDeck(deckId, folderId);
  };

  const filteredDecks = activeFilter === "all"
    ? decks
    : activeFilter === "unfiled"
    ? decks.filter((d) => !d.folder_id)
    : decks.filter((d) => d.folder_id === activeFilter);

  const dropTargetClass = (key) =>
    dragOver === key && draggingId ? "ring-2 ring-primary border-primary bg-primary/5" : "";

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-900/50 rounded-xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-blue-600 dark:text-blue-400">
              Your collection
            </span>
            <h1 className="mt-2 font-display text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              My Decks
            </h1>
            <p className="mt-2 font-body text-sm text-muted-foreground max-w-lg">
              All of your flashcard sets in one place. Drag a deck into a folder to organize it.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/create"
              className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity rounded-lg shadow-md shadow-primary/20"
            >
              <Plus className="w-4 h-4" /> Create deck
            </Link>
            <Link
              to="/create?import=1"
              className="inline-flex items-center gap-2 px-5 py-3 border border-blue-200 dark:border-blue-800 font-mono text-xs uppercase tracking-widest hover:border-primary transition-colors rounded-lg"
            >
              <Upload className="w-4 h-4" /> Import
            </Link>
          </div>
        </div>
      </div>

      {/* Folder drop zones */}
      <div className="mt-6 flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setActiveFilter("all")}
          onDragOver={(e) => { e.preventDefault(); setDragOver("all"); }}
          onDragLeave={() => setDragOver(null)}
          onDrop={(e) => onDropFolder(e, null)}
          className={`px-4 py-2 font-mono text-xs uppercase tracking-widest border rounded-full transition-colors ${
            activeFilter === "all" ? "border-primary text-primary bg-primary/5" : "border-border text-muted-foreground hover:border-primary hover:text-foreground"
          } ${dropTargetClass("all")}`}
        >
          All ({decks.length})
        </button>
        <button
          onClick={() => setActiveFilter("unfiled")}
          onDragOver={(e) => { e.preventDefault(); setDragOver("unfiled"); }}
          onDragLeave={() => setDragOver(null)}
          onDrop={(e) => onDropFolder(e, null)}
          className={`px-4 py-2 font-mono text-xs uppercase tracking-widest border rounded-full transition-colors ${
            activeFilter === "unfiled" ? "border-primary text-primary bg-primary/5" : "border-border text-muted-foreground hover:border-primary hover:text-foreground"
          } ${dropTargetClass("unfiled")}`}
        >
          Unfiled ({decks.filter((d) => !d.folder_id).length})
        </button>
        {folders.map((f) => {
          const count = decks.filter((d) => d.folder_id === f.id).length;
          return (
            <div key={f.id} className="relative group">
              <button
                onClick={() => setActiveFilter(f.id)}
                onDragOver={(e) => { e.preventDefault(); setDragOver(f.id); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => onDropFolder(e, f.id)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 font-mono text-xs uppercase tracking-widest border rounded-full transition-colors ${
                  activeFilter === f.id ? "border-primary text-primary bg-primary/5" : "border-border text-muted-foreground hover:border-primary hover:text-foreground"
                } ${dropTargetClass(f.id)}`}
              >
                <Folder className="w-3.5 h-3.5" />
                {f.name} ({count})
              </button>
              <button
                onClick={() => deleteFolder(f.id)}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
        {creatingFolder ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") createFolder(); if (e.key === "Escape") setCreatingFolder(false); }}
              placeholder="Folder name…"
              className="px-3 py-2 bg-card border border-border font-body text-sm focus:outline-none focus:border-primary rounded-full"
            />
            <button
              onClick={createFolder}
              className="px-3 py-2 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest rounded-full"
            >
              Add
            </button>
            <button
              onClick={() => { setCreatingFolder(false); setNewFolderName(""); }}
              className="px-2 py-2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCreatingFolder(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-dashed border-border font-mono text-xs uppercase tracking-widest text-muted-foreground hover:border-primary hover:text-primary transition-colors rounded-full"
          >
            <FolderPlus className="w-3.5 h-3.5" /> New folder
          </button>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {loading ? "Loading…" : `${filteredDecks.length} ${filteredDecks.length === 1 ? "deck" : "decks"}`}
        </p>
        {draggingId && (
          <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
            Drop into a folder ↑
          </p>
        )}
      </div>

      {loading ? (
        <div className="py-20 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filteredDecks.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-blue-200 dark:border-blue-800 rounded-xl">
          <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <p className="font-body text-sm text-muted-foreground mb-5">
            {activeFilter === "unfiled" ? "No unfiled decks." : decks.length === 0 ? "You have no decks yet." : "No decks in this folder."}
          </p>
          <div className="flex justify-center gap-3">
            <Link to="/create" className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest rounded-lg">
              <Plus className="w-3.5 h-3.5" /> Create
            </Link>
            <Link to="/create?import=1" className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-border font-mono text-xs uppercase tracking-widest rounded-lg hover:border-primary transition-colors">
              <Upload className="w-3.5 h-3.5" /> Import
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDecks.map((d, i) => (
            <div
              key={d.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("text/deckId", d.id);
                e.dataTransfer.effectAllowed = "move";
                setDraggingId(d.id);
              }}
              onDragEnd={() => { setDraggingId(null); setDragOver(null); }}
              className={`relative group ${draggingId === d.id ? "opacity-50" : ""}`}
            >
              <DeckCard deck={d} index={i} cardCount={counts[d.id]} />
              <span
                title="Drag into a folder"
                className="absolute top-2 right-2 p-1.5 rounded-md bg-card border border-border text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
              >
                <GripVertical className="w-4 h-4" />
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}