// Centralized study sound effects. Every study sound routes through here so
// the asset paths and volume live in one place. Playback is non-essential
// feedback, so autoplay restrictions / missing files are silently swallowed.
const VOLUME = 0.3;

export function playSound(name) {
  try {
    const audio = new Audio(`/sounds/${name}.mp3`);
    audio.volume = VOLUME;
    const p = audio.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  } catch {
    /* ignore */
  }
}