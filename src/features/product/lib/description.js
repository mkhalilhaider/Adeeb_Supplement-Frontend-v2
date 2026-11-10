/**
 * Turn the backend's plain-text description into display blocks, without inventing structure:
 * - blank lines separate paragraphs;
 * - a paragraph made of several short lines that don't end in sentence punctuation reads as a
 *   bullet list (that's how benefits are typed in the admin: "Boosts metabolism\nControls…").
 *
 * @param {string} text
 * @returns {({ type: "p", text: string } | { type: "ul", items: string[] })[]}
 */
export function parseDescription(text) {
  return String(text ?? "")
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((block) =>
      block
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    )
    .filter((lines) => lines.length > 0)
    .map((lines) => {
      const listLike =
        lines.length >= 2 && lines.every((l) => l.length <= 90 && !/[.!?:]$/.test(l));
      const cleaned = lines.map((l) => l.replace(/^[-•*–]\s*/, ""));
      return listLike ? { type: "ul", items: cleaned } : { type: "p", text: lines.join(" ") };
    });
}

/** First sentence-ish chunk, for meta descriptions (≤ 160 chars, cut at a word). */
export function summarize(text, max = 160) {
  const flat = String(text ?? "")
    .replace(/\s+/g, " ")
    .trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}
