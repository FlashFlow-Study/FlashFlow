// Parsing and serialization for deck import/export across CSV, JSON, and tab-separated formats.

function parseCSVRows(text) {
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") { row.push(field); field = ""; }
      else if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else field += ch;
    }
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => String(c).trim() !== ""));
}

export function parseCSV(text) {
  const rows = parseCSVRows(text);
  if (!rows.length) return { cards: [] };
  let start = 0;
  const first = rows[0].map((s) => String(s).toLowerCase().trim());
  const headerText = first.join(",");
  if (/^(front|term|question)/.test(headerText) && /(back|definition|answer)/.test(headerText)) start = 1;
  const cards = [];
  for (let i = start; i < rows.length; i++) {
    const front = (rows[i][0] || "").trim();
    const back = (rows[i][1] || "").trim();
    if (front || back) cards.push({ front, back });
  }
  return { cards };
}

export function parseTab(text) {
  const lines = text.replace(/\r/g, "").split("\n").filter((l) => l.trim());
  if (!lines.length) return { cards: [] };
  let start = 0;
  const first = lines[0].toLowerCase();
  if (/^(front|term|question)\t(back|definition|answer)/.test(first)) start = 1;
  const cards = [];
  for (let i = start; i < lines.length; i++) {
    const idx = lines[i].indexOf("\t");
    let front, back;
    if (idx === -1) { front = lines[i].trim(); back = ""; }
    else { front = lines[i].slice(0, idx).trim(); back = lines[i].slice(idx + 1).trim(); }
    if (front || back) cards.push({ front, back });
  }
  return { cards };
}

export function parseJSON(text) {
  const data = JSON.parse(text);
  const norm = (c) => ({
    front: String(c.front ?? c.term ?? c.question ?? ""),
    back: String(c.back ?? c.definition ?? c.answer ?? ""),
  });
  if (Array.isArray(data)) {
    return { cards: data.map(norm).filter((c) => c.front || c.back) };
  }
  return {
    title: data.title,
    description: data.description,
    is_public: data.is_public,
    tags: data.tags,
    cards: (data.cards || []).map(norm),
  };
}

export function parseSet(text, format) {
  if (format === "json") return parseJSON(text);
  if (format === "tab") return parseTab(text);
  return parseCSV(text);
}

function csvField(s) {
  s = s || "";
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

export function serializeCSV(deck, cards) {
  const rows = ["front,back"];
  cards.forEach((c) => rows.push(csvField(c.front) + "," + csvField(c.back)));
  return rows.join("\n");
}

export function serializeTab(deck, cards) {
  return cards.map((c) => c.front + "\t" + c.back).join("\n");
}

export function serializeJSON(deck, cards) {
  return JSON.stringify(
    {
      title: deck.title,
      description: deck.description,
      is_public: deck.is_public,
      tags: deck.tags,
      cards: cards.map((c) => ({ front: c.front, back: c.back })),
    },
    null,
    2
  );
}

export function serializeSet(deck, cards, format) {
  if (format === "json") return serializeJSON(deck, cards);
  if (format === "tab") return serializeTab(deck, cards);
  return serializeCSV(deck, cards);
}

export function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime || "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const FORMAT_EXT = { csv: "csv", json: "json", tab: "txt" };
export const FORMAT_MIME = { csv: "text/csv", json: "application/json", tab: "text/plain" };
export const FORMAT_LABEL = { csv: "CSV", json: "JSON", tab: "Tab-separated" };