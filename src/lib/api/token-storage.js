/**
 * Where access/refresh tokens live. The backend returns tokens in the response body and has no
 * cookie support, so they must be stored in the browser.
 *
 * - Customers: localStorage — stays logged in across tabs and restarts.
 * - Admins:    sessionStorage — cleared when the browser closes (see architecture §9).
 *
 * All access goes through try/catch: storage can be blocked (private mode, strict settings).
 */
const KEYS = { access: "adeeb.at", refresh: "adeeb.rt" };

function safe(fn, fallback = null) {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

const stores = () => [
  { name: "session", storage: safe(() => window.sessionStorage) },
  { name: "local", storage: safe(() => window.localStorage) },
];

/** The storage that currently holds a session (admin session wins if both exist). */
function activeStore() {
  return stores().find(({ storage }) => storage && safe(() => storage.getItem(KEYS.refresh)));
}

export const tokenStorage = {
  getAccessToken() {
    const store = activeStore();
    return store ? safe(() => store.storage.getItem(KEYS.access)) : null;
  },

  getRefreshToken() {
    const store = activeStore();
    return store ? safe(() => store.storage.getItem(KEYS.refresh)) : null;
  },

  /** "admin" | "customer" | null */
  getScope() {
    const store = activeStore();
    if (!store) return null;
    return store.name === "session" ? "admin" : "customer";
  },

  /**
   * Save a token pair. On refresh, pass no scope to keep the pair in the storage it came from.
   * @param {{accessToken: string, refreshToken: string}} tokens
   * @param {"admin"|"customer"} [scope]
   */
  save({ accessToken, refreshToken }, scope) {
    const target = scope ?? this.getScope() ?? "customer";
    const name = target === "admin" ? "session" : "local";
    this.clear();
    const store = stores().find((s) => s.name === name)?.storage;
    if (!store) return;
    safe(() => {
      store.setItem(KEYS.access, accessToken);
      store.setItem(KEYS.refresh, refreshToken);
    });
  },

  clear() {
    for (const { storage } of stores()) {
      if (!storage) continue;
      safe(() => {
        storage.removeItem(KEYS.access);
        storage.removeItem(KEYS.refresh);
      });
    }
  },

  hasSession() {
    return Boolean(this.getRefreshToken());
  },

  keys: KEYS,
};
