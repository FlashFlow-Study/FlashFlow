import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";
import { useSeo } from "@/lib/useSeo";
import { excerpt } from "@/lib/markdown";
import Markdown from "@/components/Markdown";
import { Image } from "@/components/ui/image";

export default function BlogPost() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const p = await base44.entities.BlogPost.get(id);
        setPost(p);
      } catch {
        setPost(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useSeo(
    post && post !== false ? `${post.title} | FlashFlow Blog` : "Blog | FlashFlow",
    post && post !== false ? excerpt(post.body, 155) : "FlashFlow blog posts."
  );

  if (loading)
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );

  if (post === false)
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="font-display text-2xl text-foreground">Post not found</p>
        <Link to="/blog" className="mt-6 inline-block font-mono text-xs uppercase tracking-widest text-primary">
          ← Back to blog
        </Link>
      </div>
    );

  return (
    <article className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <Link
        to="/blog"
        className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to blog
      </Link>

      {post.image_url && (
        <div className="mt-6 aspect-[16/8] overflow-hidden rounded-xl bg-muted">
          <Image
            src={post.image_url}
            fittingType="fill"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <h1 className="mt-6 font-display text-4xl md:text-5xl font-bold text-foreground tracking-tight">
        {post.title}
      </h1>
      <div className="mt-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {post.author && <span className="text-foreground normal-case font-body text-sm">{post.author}</span>}
        {post.author && post.created_date && <span>·</span>}
        {post.created_date && <span>{format(new Date(post.created_date), "MMMM d, yyyy")}</span>}
      </div>

      <div className="mt-8">
        <Markdown>{post.body || ""}</Markdown>
      </div>
    </article>
  );
}