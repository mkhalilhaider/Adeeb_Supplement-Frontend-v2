/**
 * Validated app configuration. Read env values only through `env`.
 * Hand-rolled (not Zod) on purpose: this module is in the first-load bundle, and a schema
 * library would add ~23 kB gzip just to check four strings. Zod is loaded later, with forms.
 */
const source = import.meta.env;
const problems = [];

function readUrl(key, fallback) {
  const value = String(source[key] ?? "").trim() || fallback;
  if (!value) {
    problems.push(`${key} is required (see .env.example)`);
    return "";
  }
  try {
    const url = new URL(value);
    if (!/^https?:$/.test(url.protocol)) throw new Error("bad protocol");
    return value.replace(/\/+$/, "");
  } catch {
    problems.push(`${key} must be a full http(s) URL, got "${value}"`);
    return "";
  }
}

const apiUrl = readUrl("VITE_API_URL");
const siteUrl = readUrl("VITE_SITE_URL", "https://www.adeebsupplement.pk");

if (problems.length > 0) {
  throw new Error(`Invalid environment configuration:\n- ${problems.join("\n- ")}`);
}

export const env = Object.freeze({
  apiUrl,
  siteUrl,
  googleAuthEnabled: String(source.VITE_GOOGLE_AUTH_ENABLED ?? "").trim() === "true",
  gaId: String(source.VITE_GA_ID ?? "").trim(),
  metaPixelId: String(source.VITE_META_PIXEL_ID ?? "").trim(),
  isDev: Boolean(source.DEV),
});
