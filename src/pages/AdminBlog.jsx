import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Save, Trash2, Pencil, Plus, X, ImagePlus, Lock } from "lucide-react";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useSeo } from "@/lib/useSeo";
import Markdown from "@/components/Markdown";
import { excerpt } from "@/lib/markdown";

export default function AdminBlog() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  useSeo("Blog — Admin | FlashFlow", "Admin editor for FlashFlow blog posts.");

  const load = async () => {
    try {
      const list = await base44.entities.BlogPost.list("-created_date", 200);
      setPosts(list);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    if (!author) setAuthor(user?.display_name || user?.full_name || "FlashFlow");
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const onImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      setImageUrl(file_url);
    } catch {
      /* ignore */
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const resetEditor = () => {
    setEditingId(null);
    setTitle("");
    setAuthor(user?.display_name || user?.full_name || "FlashFlow");
    setImageUrl("");
    setBody("");
    setError("");
  };

  const save = async () => {
    setError("");
    if (!title.trim()) {
      setError("Give the article a title.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        author: author.trim() || "FlashFlow",
        image_url: imageUrl || undefined,
        body,
      };
      if (editingId) {
        await base44.entities.BlogPost.update(editingId, payload);
      } else {
        await base44.entities.BlogPost.create(payload);
      }
      resetEditor();
      await load();
    } catch (e) {
      setError(e.response?.data?.error || "Couldn't save the post.");
    } finally {
      setSaving(false);
    }
  };

  const editPost = (p) => {
    setEditingId(p.id);
    setTitle(p.title || "");
    setAuthor(p.author || "");
    setImageUrl(p.image_url || "");
    setBody(p.body || "");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (p) => {
    setBusy(p.id);
    try {
      await base44.entities.BlogPost.delete(p.id);
      setPosts((prev) => prev.filter((x) => x.id !== p.id));
      if (editingId === p.id) resetEditor();
    } catch {
      /* ignore */
    } finally {
      setBusy(null);
    }
  };

  if (!isAdmin)
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <Lock className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
        <p className="font-display text-2xl text-foreground">Admins only</p>
        <p className="mt-2 font-body text-sm text-muted-foreground">You don't have access to this page.</p>
        <Link to="/" className="mt-6 inline-block font-mono text-xs uppercase tracking-widest text-primary">
          ← Back home
        </Link>
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <Link to="/admin" className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
        ← Back to admin
      </Link>
      <h1 className="mt-4 font-display text-4xl font-bold text-foreground tracking-tight">
        {editingId ? "Edit post" : "Blog"}
      </h1>
      <p className="mt-2 font-body text-sm text-muted-foreground max-w-lg">
        Write and manage blog posts published on the public blog. The body supports Markdown.
      </p>

      {/* Editor */}
      <div className="mt-6 p-5 md:p-6 border border-border bg-card rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Name of article"
              className="w-full mt-1 px-4 py-2.5 bg-background border border-border font-body text-sm focus:outline-none focus:border-primary rounded-md"
            />
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Author</label>
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Name of author"
              className="w-full mt-1 px-4 py-2.5 bg-background border border-border font-body text-sm focus:outline-none focus:border-primary rounded-md"
            />
          </div>
        </div>

        {/* Top picture */}
        <div className="mt-4">
          <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Top picture (optional)</label>
          {imageUrl ? (
            <div className="mt-1 relative">
              <img src={imageUrl} alt="Top picture preview" className="w-full aspect-[16/7] object-cover rounded-md border border-border" />
              <button
                type="button"
                onClick={() => setImageUrl("")}
                className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 bg-destructive text-destructive-foreground rounded-md font-mono text-[10px] uppercase tracking-widest"
              >
                <X className="w-3 h-3" /> Remove
              </button>
            </div>
          ) : (
            <label className="mt-1 flex flex-col items-center justify-center gap-2 w-full aspect-[16/7] border border-dashed border-border rounded-md cursor-pointer hover:border-primary transition-colors text-muted-foreground">
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <ImagePlus className="w-5 h-5" />
                  <span className="font-mono text-[10px] uppercase tracking-widest">Upload top picture</span>
                </>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onImage} />
            </label>
          )}
        </div>

        {/* Body + live preview */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Article (Markdown)</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={14}
              placeholder={"Write your post in Markdown…\n\n# A heading\n\nSome **bold** text and a list:\n\n- one\n- two"}
              className="w-full mt-1 px-4 py-3 bg-background border border-border font-mono text-sm leading-relaxed focus:outline-none focus:border-primary rounded-md resize-y"
            />
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Live preview</label>
            <div className="mt-1 p-4 border border-border rounded-md bg-background min-h-[14rem] overflow-hidden">
              {title || imageUrl || body ? (
                <>
                  {imageUrl && (
                    <img src={imageUrl} alt="" className="w-full aspect-[16/7] object-cover rounded-md mb-3" />
                  )}
                  {title && <h2 className="font-display text-2xl text-foreground tracking-tight">{title}</h2>}
                  {author && (
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{author}</p>
                  )}
                  <div className="mt-3">
                    <Markdown>{body || ""}</Markdown>
                  </div>
                </>
              ) : (
                <p className="font-body text-sm text-muted-foreground">Preview appears here as you type.</p>
              )}
            </div>
          </div>
        </div>

        {error && <p className="mt-4 font-body text-sm text-destructive">{error}</p>}

        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest disabled:opacity-40 hover:opacity-90 transition-opacity rounded-md"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {editingId ? "Update post" : "Publish post"}
          </button>
          {editingId && (
            <button
              onClick={resetEditor}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-border font-mono text-xs uppercase tracking-widest hover:border-foreground transition-colors rounded-md"
            >
              <X className="w-3.5 h-3.5" /> Cancel edit
            </button>
          )}
        </div>
      </div>

      {/* Existing posts */}
      <div className="mt-8">
        <h2 className="font-display text-2xl text-foreground">Published posts</h2>
        {loading ? (
          <div className="py-10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <p className="mt-3 font-body text-sm text-muted-foreground">No posts yet.</p>
        ) : (
          <div className="mt-4 divide-y divide-border border border-border rounded-md">
            {posts.map((p) => (
              <div key={p.id} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-base text-foreground truncate">{p.title}</p>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
                    {p.author || "—"} {p.created_date && `· ${format(new Date(p.created_date), "MMM d, yyyy")}`}
                  </p>
                  {p.body && <p className="mt-1 font-body text-xs text-muted-foreground line-clamp-1">{excerpt(p.body, 90)}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => editPost(p)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border font-mono text-[10px] uppercase tracking-widest rounded-md hover:border-primary transition-colors"
                  >
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                  <button
                    onClick={() => remove(p)}
                    disabled={busy === p.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-destructive/40 text-destructive font-mono text-[10px] uppercase tracking-widest rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  >
                    {busy === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}