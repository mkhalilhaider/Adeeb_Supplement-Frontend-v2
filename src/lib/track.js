/**
 * Analytics calls that load the analytics code on first use, so it isn't part of any page's
 * first download. Nothing is lost: a call made before the code arrives runs once it does.
 */
const load = () => import("./analytics");

/** @param {string} path */
export function trackPageView(path) {
  load()
    .then((m) => m.trackPageView(path))
    .catch(() => {});
}

/** @param {string} name @param {Record<string, unknown>} [params] */
export function trackEvent(name, params) {
  load()
    .then((m) => m.trackEvent(name, params))
    .catch(() => {});
}
