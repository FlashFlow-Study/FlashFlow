// Pronunciation scoring helpers for the Speaking practice mode.
// All comparisons are forgiving: lowercase, strip accents and punctuation,
// then a Levenshtein-based similarity ratio.

// Normalize a string for comparison: lowercase, drop diacritics, keep only
// letters/numbers/spaces/hyphens, collapse whitespace.
export function normalizeTerm(str) {
  if (!str) return "";
  return String(str)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip combining diacritics
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s-]/gu, "") // keep letters, numbers, spaces, hyphens
    .replace(/\s+/g, " ")
    .trim();
}

// Classic iterative Levenshtein edit distance.
export function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  let curr = new Array(n + 1);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

// Similarity ratio in [0, 1] between two strings (1 = identical).
export function similarity(a, b) {
  const na = normalizeTerm(a);
  const nb = normalizeTerm(b);
  if (!na && !nb) return 1;
  const maxLen = Math.max(na.length, nb.length);
  if (!maxLen) return 1;
  const dist = levenshtein(na, nb);
  return Math.max(0, 1 - dist / maxLen);
}

// Score a spoken attempt against the expected term.
// Returns { verdict, score, heard, expected } where verdict is one of:
// "perfect" | "close" | "tryagain".
export function scorePronunciation(spoken, expected) {
  const heard = (spoken || "").trim();
  const score = similarity(heard, expected);
  let verdict;
  if (!heard) verdict = "tryagain";
  else if (score >= 0.95) verdict = "perfect";
  else if (score >= 0.7) verdict = "close";
  else verdict = "tryagain";
  return { verdict, score, heard, expected };
}