// Lightweight Web Speech API helpers for FlashFlow's pronunciation features.
// Everything uses the browser's built-in speechSynthesis — no external APIs/keys.

let voices = [];

function loadVoices() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  voices = window.speechSynthesis.getVoices() || [];
}

if (typeof window !== "undefined" && window.speechSynthesis) {
  loadVoices();
  // Voices load asynchronously in most browsers.
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

export function speechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/**
 * Pick the best available SpeechSynthesisVoice for a BCP-47 language code.
 * Falls back to null (the browser's default voice) when none matches.
 */
export function pickVoice(lang) {
  if (!lang) return null;
  const norm = lang.toLowerCase();
  const prefix = norm.split("-")[0];
  const exact = voices.find((v) => v.lang && v.lang.toLowerCase() === norm);
  if (exact) return exact;
  const prefixMatch = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith(prefix));
  return prefixMatch || null;
}

// Common languages for the deck language dropdowns (BCP-47 codes).
export const LANGUAGES = [
  { code: "en-US", label: "English (US)" },
  { code: "en-GB", label: "English (UK)" },
  { code: "es-ES", label: "Spanish (Spain)" },
  { code: "es-MX", label: "Spanish (Mexico)" },
  { code: "fr-FR", label: "French" },
  { code: "de-DE", label: "German" },
  { code: "it-IT", label: "Italian" },
  { code: "pt-BR", label: "Portuguese (Brazil)" },
  { code: "pt-PT", label: "Portuguese (Portugal)" },
  { code: "nl-NL", label: "Dutch" },
  { code: "ru-RU", label: "Russian" },
  { code: "pl-PL", label: "Polish" },
  { code: "tr-TR", label: "Turkish" },
  { code: "sv-SE", label: "Swedish" },
  { code: "no-NO", label: "Norwegian" },
  { code: "da-DK", label: "Danish" },
  { code: "fi-FI", label: "Finnish" },
  { code: "el-GR", label: "Greek" },
  { code: "cs-CZ", label: "Czech" },
  { code: "ro-RO", label: "Romanian" },
  { code: "hu-HU", label: "Hungarian" },
  { code: "uk-UA", label: "Ukrainian" },
  { code: "ar-SA", label: "Arabic" },
  { code: "he-IL", label: "Hebrew" },
  { code: "hi-IN", label: "Hindi" },
  { code: "zh-CN", label: "Chinese (Mandarin)" },
  { code: "ja-JP", label: "Japanese" },
  { code: "ko-KR", label: "Korean" },
  { code: "th-TH", label: "Thai" },
  { code: "vi-VN", label: "Vietnamese" },
  { code: "id-ID", label: "Indonesian" },
  { code: "ms-MY", label: "Malay" },
  { code: "la", label: "Latin" },
];

export function languageLabel(code) {
  if (!code) return "";
  const found = LANGUAGES.find((l) => l.code === code);
  return found ? found.label : code;
}