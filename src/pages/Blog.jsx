import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Newspaper } from "lucide-react";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";
import { useSeo } from "@/lib/useSeo";
import { excerpt } from "@/lib/markdown";
import { Image } from "@/components/ui/image";

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useSeo(
    "Blog | FlashFlow",
    "Study tips, product updates, and stories from the FlashFlow community — helping students master material faster with flashcards."
  );

  useEffect(() => {
    (async () => {
      try {
        const list = await base44.entities.BlogPost.list("-created_date", 50);
        setPosts(list);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">FlashFlow Blog</span>
      <h1 className="mt-2 font-display text-4xl md:text-5xl font-bold text-foreground tracking-tight">
        Notes from the study
      </h1>
      <p className="mt-3 font-body text-sm text-muted-foreground max-w-lg">
        Study tips, product updates, and stories from the FlashFlow community.
      </p>

      {loading ? (
        <div className="py-20 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : posts.length === 0 ? (
        <div className="mt-10 p-10 border border-dashed border-border rounded-md text-center">
          <Newspaper className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-body text-sm text-muted-foreground">No posts yet — check back soon.</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {posts.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Link
                to={`/blog/${p.id}`}
                className="group block h-full bg-card border border-border rounded-xl overflow-hidden hover:border-primary hover:shadow-md transition-all"
              >
                {p.image_url ? (
                  <div className="aspect-[16/9] overflow-hidden bg-muted">
                    <Image
                      src={p.image_url}
                      fittingType="fill"
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="aspect-[16/9] bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                    <Newspaper className="w-8 h-8 text-primary/40" />
                  </div>
                )}
                <div className="p-5">
                  <h2 className="font-display text-xl text-foreground tracking-tight line-clamp-2">{p.title}</h2>
                  <div className="mt-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {p.author && <span className="truncate">{p.author}</span>}
                    {p.author && p.created_date && <span>·</span>}
                    {p.created_date && <span>{format(new Date(p.created_date), "MMM d, yyyy")}</span>}
                  </div>
                  {p.body && (
                    <p className="mt-3 font-body text-sm text-muted-foreground line-clamp-3">{excerpt(p.body, 160)}</p>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}