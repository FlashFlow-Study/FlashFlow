export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Build a list of question objects from raw cards.
 * Each question keeps the original card fields and adds:
 *   prompt, answer, flipped, promptLabel, answerLabel
 * `shuffle` randomizes order; `varyDirection` flips term↔definition per card.
 */
export function buildQuestions(cards, { shuffle: doShuffle = false, varyDirection = false } = {}) {
  const ordered = doShuffle ? shuffle(cards) : [...cards];
  return ordered.map((c) => {
    // A card's persistent `orientation` is the base direction; the per-session
    // `varyDirection` toggle adds a random flip on top (XOR). The resulting
    // `flipped` drives prompt/answer/labels and pronunciation language, so a
    // swapped card is still voiced on its foreign-language side either way.
    const baseFlip = c.orientation === "swapped";
    const randFlip = varyDirection && Math.random() < 0.5;
    const flipped = baseFlip !== randFlip;
    return {
      ...c,
      orientation: c.orientation || "normal",
      prompt: flipped ? c.back : c.front,
      answer: flipped ? c.front : c.back,
      flipped,
      promptLabel: flipped ? "Definition" : "Term",
      answerLabel: flipped ? "Term" : "Definition",
    };
  });
}