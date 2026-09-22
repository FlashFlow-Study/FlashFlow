// Shared helpers for the FlashFlow live multiplayer game backend functions.

export function normalize(s) {
  return (s || "").toString().trim().toLowerCase().replace(/\s+/g, " ");
}

export function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

// Match front↔back like elsewhere in the app: exact for two-language decks,
// typo-tolerant (Levenshtein) for regular decks.
export function isAnswerCorrect(userAnswer, correctAnswer, isTwoLanguages) {
  const a = normalize(userAnswer);
  const b = normalize(correctAnswer);
  if (a === b) return true;
  if (isTwoLanguages) return false;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen < 5) return false;
  const threshold = Math.min(Math.max(1, Math.floor(maxLen / 5)), 4);
  return levenshtein(a, b) <= threshold;
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 5-char codes, no easily-confused characters (0/O/1/I omitted).
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function genCode(len = 5) {
  let s = "";
  for (let i = 0; i < len; i++) s += CHARS[Math.floor(Math.random() * CHARS.length)];
  return s;
}

// Speed bonus decays from 100 to 0 over 10 seconds.
export function speedBonus(startedAtIso) {
  if (!startedAtIso) return 0;
  const secs = (Date.now() - new Date(startedAtIso).getTime()) / 1000;
  return Math.max(0, Math.round(100 - secs * 10));
}