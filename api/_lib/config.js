/** Server-side settings for the Vercel functions (no Vite at runtime). */
export const SITE_URL = (
  process.env.SITE_URL ||
  process.env.VITE_SITE_URL ||
  "https://www.adeebsupplement.pk"
).replace(/\/+$/, "");

export const API_URL = (process.env.API_URL || process.env.VITE_API_URL || "").replace(/\/+$/, "");

/** GET a backend endpoint and return `data` from its envelope. */
export async function backendData(path, { timeout = 8000 } = {}) {
  if (!API_URL) throw new Error("API_URL is not configured");
  const response = await fetch(`${API_URL}${path}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(timeout),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Backend ${response.status} for ${path}`);
  const body = await response.json();
  return body?.data ?? null;
}

export const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** JSON for a <script type="application/ld+json"> block (can't close the tag early). */
export const jsonForScript = (value) => JSON.stringify(value).replace(/</g, "\\u003c");
