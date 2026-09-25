import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Globe, Lock, Layers, User, School } from "lucide-react";
import UserBadges from "@/components/UserBadges";

function relativeDate(iso) {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  const day = 86400000;
  if (diff < day) return "today";
  if (diff < 2 * day) return "yesterday";
  const d = Math.floor(diff / day);
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

export default function DeckCard({ deck, index = 0, cardCount, lastStudied, compact, creatorName, badges }) {
  const navigate = useNavigate();
  const studied = relativeDate(lastStudied);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: "easeOut" }}
      whileHover={{ scale: 1.01 }}
    >
      <Link
        to={`/deck/${deck.id}`}
        className={`group block h-full bg-card border border-blue-100 dark:border-blue-900/40 transition-all hover:border-primary hover:shadow-md hover:shadow-blue-100 dark:hover:shadow-blue-950/30 rounded-xl ${
          compact ? "p-4" : "p-6"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className={`font-display leading-tight text-foreground tracking-tight ${compact ? "text-xl" : "text-2xl"}`}>
            {deck.title}
          </h3>
          <span
            className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest px-2 py-1 border ${
              deck.classroom_id
                ? "border-indigo-300 text-indigo-600 dark:border-indigo-700 dark:text-indigo-400"
                : deck.is_public
                ? "border-primary/30 text-primary"
                : "border-border text-muted-foreground"
            }`}
          >
            {deck.classroom_id ? <School className="w-3 h-3" /> : deck.is_public ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            {deck.classroom_id ? "Class" : deck.is_public ? "Public" : "Private"}
          </span>
        </div>
        {deck.description ? (
          <p className="mt-3 text-sm font-body text-muted-foreground line-clamp-2">
            {deck.description}
          </p>
        ) : (
          <p className="mt-3 text-sm font-body text-muted-foreground italic">No description</p>
        )}
        <div className={`mt-5 flex items-center justify-between border-t border-blue-100 dark:border-blue-900/40 pt-4 ${compact ? "mt-3 pt-3" : ""}`}>
          <span className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
            <Layers className="w-3.5 h-3.5" />
            {cardCount ?? "—"} cards
          </span>
          {studied && (
            <span className="text-[10px] font-mono uppercase tracking-widest text-primary/80">
              Studied {studied}
            </span>
          )}
        </div>
        {creatorName && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`/profile/${deck.created_by_id}`);
            }}
            className={`flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground hover:text-primary transition-colors ${compact ? "mt-2" : "mt-3"}`}
          >
            <User className="w-3 h-3 text-blue-500" />
            by {creatorName}{badges ? <UserBadges verified={badges.verified} admin={badges.admin} className="ml-1" /> : null}
          </button>
        )}
      </Link>
    </motion.div>
  );
}