/**
 * Refresh tokens rotate: using one invalidates it. If two tabs (or two parallel requests)
 * refresh with the same token, the second fails and logs the user out. This module makes sure
 * only one refresh runs at a time — within a tab (shared promise) and across tabs (Web Locks).
 */
const LOCK_NAME = "adeeb-auth-refresh";

/**
 * Run `fn` while holding a cross-tab lock; falls back to running directly if unsupported.
 * Use a different `name` for anything that may itself refresh the session (or it deadlocks).
 */
export function withCrossTabLock(fn, name = LOCK_NAME) {
  const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
  if (!locks?.request) return fn();
  return locks.request(name, { mode: "exclusive" }, fn);
}

let inFlight = null;

/**
 * Deduplicate concurrent calls in this tab: everyone waiting on a refresh shares one promise.
 * @template T
 * @param {() => Promise<T>} fn
 * @returns {Promise<T>}
 */
export function singleFlight(fn) {
  if (!inFlight) {
    inFlight = Promise.resolve()
      .then(fn)
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}
