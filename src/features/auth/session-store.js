import { create } from "zustand";
import { ApiError, setApiHooks, tokenStorage } from "../../lib/api";
import { queryClient } from "../../lib/query-client";
import { fetchMe, logout as logoutRequest } from "./api";

/** @typedef {import("../../types").SessionUser} SessionUser */

const USER_KEY = "adeeb.user";

/** The user snapshot lives next to the tokens (localStorage for customers, sessionStorage for admins). */
function snapshotStorage(scope) {
  try {
    return scope === "admin" ? window.sessionStorage : window.localStorage;
  } catch {
    return null;
  }
}

function readSnapshot() {
  const scope = tokenStorage.getScope();
  if (!scope) return null;
  try {
    const raw = snapshotStorage(scope)?.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSnapshot(user, scope) {
  for (const s of ["admin", "customer"]) {
    try {
      snapshotStorage(s)?.removeItem(USER_KEY);
    } catch {
      /* storage unavailable */
    }
  }
  if (!user) return;
  try {
    snapshotStorage(scope)?.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    /* storage unavailable */
  }
}

/** Remove cached data that belongs to the signed-in person (cart, orders, profile…). */
function dropPrivateQueries() {
  queryClient.removeQueries({ predicate: (query) => query.meta?.private === true });
}

let verifiedThisTab = false;
/** A verification already on its way: concurrent callers (bootstrap, guards) share it. */
let verifyInFlight = null;
/** A forced check (e.g. entering /admin) reuses a backend confirmation this recent. */
const FORCE_FRESH_MS = 15_000;
let lastVerifiedAt = 0;

/**
 * @typedef {object} SessionState
 * @property {"unknown"|"authenticated"|"guest"} status
 * @property {SessionUser|null} user
 * @property {boolean} expired   true right after a session ended involuntarily (show a notice once)
 */

export const useSession = create((set, get) => ({
  status: "unknown",
  user: null,
  expired: false,

  /** Restore the session on app start: instant from the snapshot, then verified in the background. */
  bootstrap() {
    if (!tokenStorage.hasSession()) {
      set({ status: "guest", user: null });
      return;
    }
    const snapshot = readSnapshot();
    set({ status: snapshot ? "authenticated" : "unknown", user: snapshot });
    get()
      .verify()
      .catch(() => {});
  },

  /**
   * Confirm the session with the backend once per tab (or when forced, e.g. entering /admin).
   * Calls made while a check is already running reuse it instead of sending another request.
   */
  verify({ force = false } = {}) {
    if (!tokenStorage.hasSession()) {
      set({ status: "guest", user: null });
      return Promise.resolve(null);
    }
    if (verifyInFlight) return verifyInFlight;
    const fresh = Date.now() - lastVerifiedAt < FORCE_FRESH_MS;
    if (verifiedThisTab && get().user && (!force || fresh)) return Promise.resolve(get().user);
    verifyInFlight = get()
      ._fetchAndStoreUser()
      .finally(() => {
        verifyInFlight = null;
      });
    return verifyInFlight;
  },

  async _fetchAndStoreUser() {
    try {
      const user = await fetchMe();
      verifiedThisTab = true;
      lastVerifiedAt = Date.now();
      writeSnapshot(user, tokenStorage.getScope());
      set({ status: "authenticated", user });
      return user;
    } catch (error) {
      // 401 is handled by the API client (it ends the session). Network errors keep the snapshot.
      if (error instanceof ApiError && (error.isNetwork || error.isTimeout)) {
        if (!get().user) set({ status: "guest" });
        return get().user;
      }
      if (!tokenStorage.hasSession()) set({ status: "guest", user: null });
      throw error;
    }
  },

  /**
   * Start a session after login/register/Google callback.
   * @param {{ user: SessionUser, tokens: {accessToken: string, refreshToken: string} }} result
   * @param {"customer"|"admin"} [scope]
   */
  signIn({ user, tokens }, scope = "customer") {
    tokenStorage.save(tokens, scope);
    writeSnapshot(user, scope);
    verifiedThisTab = true;
    dropPrivateQueries();
    set({ status: "authenticated", user, expired: false });
  },

  /** Voluntary logout of this device. Never blocks on the network. */
  async signOut() {
    const accessToken = tokenStorage.getAccessToken();
    const refreshToken = tokenStorage.getRefreshToken();
    get().clear();
    if (accessToken && refreshToken) {
      // Best effort: revoke this device's refresh token on the backend. If the access token has
      // already expired this fails quietly — the refresh token then simply expires on its own.
      logoutRequest({ accessToken, refreshToken }).catch(() => {});
    }
  },

  /** Local cleanup (no network). */
  clear() {
    tokenStorage.clear();
    writeSnapshot(null);
    verifiedThisTab = false;
    dropPrivateQueries();
    set({ status: "guest", user: null });
  },

  /** Called by the API client when refresh fails. */
  expire() {
    if (get().status !== "authenticated") return;
    get().clear();
    set({ expired: true });
  },

  acknowledgeExpired() {
    set({ expired: false });
  },
}));

// Wire the API client to the session without a circular import.
setApiHooks({
  onSessionExpired: () => useSession.getState().expire(),
  onTokensRefreshed: (data) => {
    if (data?.user) {
      writeSnapshot(data.user, tokenStorage.getScope());
      useSession.setState({ user: data.user });
    }
  },
});

// Logging out (or in) in one tab updates every other tab.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== tokenStorage.keys.refresh) return;
    const { status } = useSession.getState();
    if (!event.newValue && status === "authenticated") {
      verifiedThisTab = false;
      dropPrivateQueries();
      useSession.setState({ status: "guest", user: null });
    } else if (event.newValue && status !== "authenticated") {
      useSession.getState().bootstrap();
    }
  });
}

export const selectIsAdmin = (state) =>
  state.status === "authenticated" && state.user?.role === "admin";
