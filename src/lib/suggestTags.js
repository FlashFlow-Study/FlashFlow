// Lightweight, offline tag suggester for flashcard decks.
// Analyzes card terms/definitions (plus title/description) and returns
// relevant subject / topic / exam-board / language tags based on keyword hits.

const TOPICS = {
  biology: ["cell", "cells", "dna", "gene", "genes", "protein", "enzyme", "mitochondria", "photosynthesis", "organism", "ecosystem", "mitosis", "meiosis", "nucleus", "ribosome", "chromosome", "membrane", "tissue", "respiration", "organelle"],
  chemistry: ["atom", "molecule", "reaction", "acid", "base", "ion", "bond", "element", "compound", "oxidation", "periodic", "mole", "solution", "catalyst", "ph", "isotope"],
  physics: ["force", "energy", "velocity", "acceleration", "momentum", "gravity", "wave", "voltage", "current", "circuit", "quantum", "kinetic", "thermodynamics", "newton"],
  math: ["equation", "theorem", "integral", "derivative", "algebra", "geometry", "probability", "matrix", "fraction", "calculus", "polynomial", "vector", "trigonometry", "maths"],
  history: ["war", "revolution", "empire", "century", "treaty", "ancient", "medieval", "dynasty", "monarch", "colonial", "battle", "civilization"],
  geography: ["country", "capital", "climate", "river", "mountain", "population", "continent", "latitude", "tundra", "desert", "tectonic"],
  english: ["grammar", "noun", "verb", "adjective", "sentence", "poetry", "literature", "shakespeare", "metaphor", "simile"],
  "computer science": ["algorithm", "function", "variable", "loop", "array", "programming", "code", "syntax", "compiler", "database", "recursion", "binary"],
  economics: ["supply", "demand", "market", "inflation", "gdp", "trade", "fiscal", "monetary", "scarcity"],
  psychology: ["behavior", "cognition", "memory", "emotion", "brain", "conditioning", "perception"],
  medicine: ["disease", "symptom", "treatment", "anatomy", "patient", "diagnosis", "clinical", "physiology"],
  law: ["contract", "tort", "statute", "liability", "jurisdiction", "precedent", "defendant", "plaintiff"],
  business: ["marketing", "revenue", "profit", "stakeholder", "strategy", "accounting", "audit"],
  art: ["painting", "sculpture", "perspective", "colour", "renaissance", "composition", "palette"],
  music: ["note", "chord", "scale", "rhythm", "tempo", "melody", "harmony", "clef"],
  vocabulary: ["word", "synonym", "definition", "meaning", "vocab", "vocabulary"],
  language: ["verb", "noun", "conjugation", "translation", "grammar", "adjective"],
};

const LANG_WORDS = {
  spanish: ["hola", "gracias", "buenos días", "buenas noches", "usted", "ser", "estar", "tener", "hablar", "comer", "vivir", "español", "vocabulario", "ñ"],
  french: ["bonjour", "merci", "oui", "être", "avoir", "français", "conjugaison", "ça va", "écouter", "parler"],
  german: ["guten tag", "danke", "ja", "nein", "der", "die", "das", "sein", "haben", "deutsch", "sprechen"],
  italian: ["ciao", "grazie", "essere", "avere", "italiano", "parlare", "mangiare"],
  latin: ["amo", "amare", "declension", "conjugation", "latin", "noun"],
};

const EXAM_BOARDS = ["gcse", "aqa", "edexcel", "ocr", "wjec", "cea", "ib", "ap", "sat", "a-level", "alevel", "ks3", "ks2", "ks1", "mcat", "lsat", "gre", "toefl", "ielts"];

const GENERAL = ["study", "revision", "exam", "test", "flashcards", "review"];

function hasWord(text, word) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp("(^|[^\\p{L}])" + escaped + "([^\\p{L}]|$)", "iu").test(text);
}

export function suggestTags(cards = [], title = "", description = "") {
  const text = [title, description, ...cards.flatMap((c) => [c.front || "", c.back || ""])]
    .join(" ")
    .toLowerCase();
  if (!text.trim()) return [];

  const found = new Set();

  EXAM_BOARDS.forEach((b) => {
    if (hasWord(text, b)) found.add(b.replace(/[^a-z0-9-]/gi, ""));
  });

  Object.entries(LANG_WORDS).forEach(([lang, words]) => {
    const hits = words.filter((w) => text.includes(w)).length;
    if (hits >= 2) found.add(lang);
    else if (hits >= 1 && /[áéíóúüñç¿¡àèùòì]/i.test(text)) found.add(lang);
  });

  Object.entries(TOPICS).forEach(([topic, kws]) => {
    if (kws.filter((k) => text.includes(k)).length >= 2) found.add(topic);
  });

  if (found.has("biology") || found.has("chemistry") || found.has("physics")) found.add("science");

  GENERAL.forEach((g) => {
    if (text.includes(g)) found.add(g);
  });
  if (found.has("vocabulary") || Object.keys(LANG_WORDS).some((l) => found.has(l))) found.add("language");

  const order = [
    "biology", "chemistry", "physics", "science", "math", "history", "geography",
    "english", "computer science", "economics", "psychology", "medicine", "law", "business", "art", "music",
    "spanish", "french", "german", "italian", "latin", "language", "vocabulary",
    "gcse", "aqa", "edexcel", "ocr", "wjec", "ib", "ap", "sat", "a-level", "mcat", "lsat", "gre", "toefl", "ielts",
    "study", "revision", "exam", "test", "flashcards", "review",
  ];
  return order.filter((t) => found.has(t)).slice(0, 8);
}