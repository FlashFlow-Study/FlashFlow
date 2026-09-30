// Strip Markdown syntax down to plain text, for excerpts and meta descriptions.
export function stripMarkdown(md = "") {
  return (md || "")
    .replace(/!\[(.*?)\]\([^)]*\)/g, "$1")
    .replace(/\[(.*?)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^[>*_~\s-]+/gm, "")
    .replace(/[*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function excerpt(md = "", n = 160) {
  const s = stripMarkdown(md);
  return s.length > n ? s.slice(0, n).trimEnd() + "…" : s;
}