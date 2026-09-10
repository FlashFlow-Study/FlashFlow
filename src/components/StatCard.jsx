import React from "react";
import { motion } from "framer-motion";

export default function StatCard({ label, value, index = 0, accent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: "easeOut" }}
      className="p-5 border border-slate-200 bg-card rounded-md"
    >
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`mt-2 font-display text-3xl font-bold ${accent || "text-foreground"}`}>{value}</p>
    </motion.div>
  );
}