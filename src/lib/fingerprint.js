// Lightweight, dependency-free browser fingerprint. Combines a canvas render
// with stable environment signals (UA, language, screen, timezone, hardware)
// and hashes them with SHA-256. This is not a cryptographically unforgeable
// identifier — its purpose is to catch casual ban evasion by flagging new
// accounts that sign up from the same browser as a terminated account.

export async function generateFingerprint() {
  const components = [];

  // Canvas fingerprint — varies subtly with GPU, driver, and font rendering.
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 240;
    canvas.height = 60;
    const ctx = canvas.getContext("2d");
    ctx.textBaseline = "top";
    ctx.font = "16px 'Arial'";
    ctx.fillStyle = "#f60";
    ctx.fillRect(100, 1, 80, 30);
    ctx.fillStyle = "#069";
    ctx.fillText("FlashFlow·fingerprint🎴", 4, 12);
    components.push(canvas.toDataURL());
  } catch {
    components.push("no-canvas");
  }

  components.push(navigator.userAgent || "");
  components.push(navigator.language || "");
  components.push(JSON.stringify(navigator.languages || []));
  components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);
  components.push(String(window.devicePixelRatio || 1));
  try {
    components.push(Intl.DateTimeFormat().resolvedOptions().timeZone || "");
  } catch {
    components.push("no-tz");
  }
  components.push(navigator.platform || "");
  components.push(String(navigator.hardwareConcurrency || 0));
  components.push(String(navigator.deviceMemory || 0));
  components.push(String(navigator.maxTouchPoints || 0));

  const str = components.join("|||");
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}