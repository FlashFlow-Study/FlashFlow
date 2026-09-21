// Resolves source/target languages for two-language decks, with inference and
// sensible fallbacks so pronunciation works even for decks that predate the
// explicit language-code fields.

const LANG_BY_TAG = {
  spanish: "es-ES",
  french: "fr-FR",
  german: "de-DE",
  italian: "it-IT",
  portuguese: "pt-BR",
  latin: "la",
  english: "en-US",
  chinese: "zh-CN",
  japanese: "ja-JP",
  korean: "ko-KR",
  arabic: "ar-SA",
  russian: "ru-RU",
  dutch: "nl-NL",
  greek: "el-GR",
  hebrew: "he-IL",
  hindi: "hi-IN",
  turkish: "tr-TR",
};

export const DEFAULT_SOURCE_LANG = "en-US";
export const DEFAULT_TARGET_LANG = "es-ES";

// Detect a foreign language from the deck's smart tags first, then from the
// writing system used in the cards. Returns a BCP-47 code or null.
export function detectLanguage(tags, cards) {
  const tagSet = new Set((tags || []).map((t) => String(t).toLowerCase()));
  for (const key of Object.keys(LANG_BY_TAG)) {
    if (tagSet.has(key)) return LANG_BY_TAG[key];
  }
  const text = (cards || []).map((c) => `${c.front || ""} ${c.back || ""}`).join(" ");
  if (/[\u3040-\u30ff]/.test(text)) return "ja-JP"; // Hiragana/Katakana
  if (/[\u4e00-\u9fff]/.test(text)) return "zh-CN"; // CJK ideographs
  if (/[\uac00-\ud7af]/.test(text)) return "ko-KR"; // Hangul
  if (/[\u0400-\u04ff]/.test(text)) return "ru-RU"; // Cyrillic
  if (/[\u0600-\u06ff]/.test(text)) return "ar-SA"; // Arabic
  if (/[\u0590-\u05ff]/.test(text)) return "he-IL"; // Hebrew
  if (/[\u0900-\u097f]/.test(text)) return "hi-IN"; // Devanagari
  return null;
}

// Effective languages for a two-language deck: explicit codes win, otherwise
// infer from tags/content, otherwise sensible defaults.
export function resolveDeckLanguages(deck, cards) {
  const source = deck?.source_lang;
  const target = deck?.target_lang;
  if (source && target) return { sourceLang: source, targetLang: target };
  const inferred = detectLanguage(deck?.tags, cards);
  return {
    sourceLang: source || DEFAULT_SOURCE_LANG,
    targetLang: target || inferred || DEFAULT_TARGET_LANG,
  };
}