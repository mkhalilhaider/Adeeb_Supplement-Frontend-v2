const AUTH_PAGES = /^\/(login|register|forgot-password|reset-password|verify-email|auth\/)/;

/**
 * Where to go after logging in. Only internal storefront paths are allowed — never another
 * site ("//evil.com", "https://…"), the admin area, or another auth page (no loops).
 *
 * @param {string|null|undefined} value  usually the ?returnTo= query value
 * @param {string} [fallback]
 */
export function safeReturnTo(value, fallback = "/account") {
  if (typeof value !== "string") return fallback;
  const path = value.trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return fallback;
  if (/^\/admin(\/|$|\?)/.test(path) || AUTH_PAGES.test(path)) return fallback;
  return path;
}

/** "/login?returnTo=…" for the page the shopper is on now. */
export function loginPath(returnTo, page = "/login") {
  const safe = safeReturnTo(returnTo, "");
  return safe ? `${page}?returnTo=${encodeURIComponent(safe)}` : page;
}
