// Centralized study sound effects. Every study sound routes through here so
// the asset paths and volume live in one place. Audio instances are cached
// module-level so the browser fetches/decodes each file once; replaying just
// rewinds and resumes, avoiding the per-call allocation + fetch latency.
// Playback is non-essential feedback, so autoplay restrictions / missing
// files are silently swallowed.
const VOLUME = 0.3;
const cache = new Map();

function getAudio(name) {
  let audio = cache.get(name);
  if (!audio) {
    const file = name === "question-right" ? "question-right-new" : name;
    audio = new Audio(`/sounds/${file}.mp3`);
    audio.volume = VOLUME;
    cache.set(name, audio);
  }
  return audio;
}

export function playSound(name) {
  try {
    const audio = getAudio(name);
    audio.currentTime = 0;
    const p = audio.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  } catch {
    /* ignore */
  }
}

// Prime the sounds used after session start so they're fetched and decoded
// before the first answer is graded. Safe to call multiple times.
export function warmupSounds(names = ["question-right", "question-wrong", "all-questions-answered"]) {
  names.forEach((name) => {
    try {
      const audio = getAudio(name);
      audio.preload = "auto";
      audio.load();
    } catch {
      /* ignore */
    }
  });
}