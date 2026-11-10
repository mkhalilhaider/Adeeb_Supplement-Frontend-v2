import { env } from "../../config/env";
import { ApiError, fallbackMessage, toApiError } from "./errors";
import { tokenStorage } from "./token-storage";
import { singleFlight, withCrossTabLock } from "./refresh-lock";

const DEFAULT_TIMEOUT_MS = 15_000;

/** A 401 from these means wrong credentials or a dead refresh token — never refresh-and-retry. */
const NO_REFRESH_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/forgot-password",
  "/auth/reset-password",
];

/** Hooks the session layer registers (keeps this module free of UI/state imports). */
const hooks = {
  /** Called once when a session can't be recovered (refresh failed). */
  onSessionExpired: () => {},
  /** Called after a successful refresh with the new token pair. */
  onTokensRefreshed: () => {},
};

export function setApiHooks(next) {
  Object.assign(hooks, next);
}

/**
 * @typedef {object} RequestOptions
 * @property {"GET"|"POST"|"PUT"|"PATCH"|"DELETE"} [method]
 * @property {unknown} [body]          JSON-serialisable value or FormData
 * @property {Record<string, unknown>} [query]  undefined/null/"" values are dropped
 * @property {AbortSignal} [signal]    Caller cancellation (TanStack Query passes one)
 * @property {number} [timeout]        ms, default 15s
 * @property {boolean} [auth]          Attach the access token (default true)
 * @property {HeadersInit} [headers]
 */

/**
 * The backend envelope: `{ success, message, data, meta? }`. A few endpoints spread fields at
 * the top level instead (see BACKEND_ANALYSIS §2), so callers receive the whole body.
 * @typedef {{ success: true, message?: string, data?: any, meta?: any, [key: string]: any }} Envelope
 */

export function buildUrl(path, query) {
  const url = new URL(`${env.apiUrl}${path.startsWith("/") ? path : `/${path}`}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function readBody(response) {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function send(path, options) {
  const { method = "GET", body, query, signal, timeout, auth = true, headers } = options;
  const requestHeaders = new Headers(headers);
  requestHeaders.set("Accept", "application/json");

  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  if (body !== undefined && !isForm) requestHeaders.set("Content-Type", "application/json");

  const token = auth ? tokenStorage.getAccessToken() : null;
  if (token) requestHeaders.set("Authorization", `Bearer ${token}`);

  const timeoutSignal = AbortSignal.timeout(timeout ?? DEFAULT_TIMEOUT_MS);
  const combinedSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

  let response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
      signal: combinedSignal,
    });
  } catch (error) {
    // The caller cancelled (e.g. user typed a new search) — let the AbortError through untouched.
    if (signal?.aborted) throw error;
    if (timeoutSignal.aborted) {
      throw new ApiError("The server took too long to respond. Please try again.", {
        kind: "timeout",
      });
    }
    throw new ApiError(fallbackMessage(0), { kind: "network" });
  }

  return { response, payload: await readBody(response), sentToken: Boolean(token) };
}

/**
 * Exchange the refresh token for a new pair. Returns true on success, false when the session is
 * dead. Network failures throw (so a flaky connection never logs anyone out).
 */
export function refreshSession() {
  const tokenAtCallTime = tokenStorage.getRefreshToken();

  return singleFlight(() =>
    withCrossTabLock(async () => {
      const current = tokenStorage.getRefreshToken();
      if (!current) return false;
      // Another tab refreshed while we waited for the lock — its new tokens are already saved.
      if (tokenAtCallTime && current !== tokenAtCallTime) return true;

      const { response, payload } = await send("/auth/refresh", {
        method: "POST",
        body: { refreshToken: current },
        auth: false,
      });

      if (!response.ok || payload?.success !== true || !payload?.data?.tokens) {
        if (response.status === 401 || response.status === 400) return false;
        throw toApiError(response.status, payload, response.headers);
      }

      tokenStorage.save(payload.data.tokens);
      hooks.onTokensRefreshed(payload.data);
      return true;
    }),
  );
}

function expireSession() {
  tokenStorage.clear();
  hooks.onSessionExpired();
}

/**
 * Make an API request.
 * - Unwraps nothing: resolves with the full backend envelope (see Envelope).
 * - Throws ApiError for any failure; AbortError when the caller cancels.
 * - On 401 for an authenticated call: refresh once (shared across tabs), retry once.
 *
 * @param {string} path e.g. "/catalog/products"
 * @param {RequestOptions} [options]
 * @returns {Promise<Envelope>}
 */
export async function request(path, options = {}) {
  let result = await send(path, options);

  const canRefresh =
    result.response.status === 401 &&
    result.sentToken &&
    !NO_REFRESH_PATHS.some((prefix) => path.startsWith(prefix));

  if (canRefresh) {
    let refreshed = false;
    try {
      refreshed = await refreshSession();
    } catch (error) {
      if (error instanceof ApiError && (error.isNetwork || error.isTimeout)) throw error;
    }
    if (!refreshed) {
      expireSession();
      throw new ApiError("Your session has expired. Please log in again.", { status: 401 });
    }
    result = await send(path, options);
    if (result.response.status === 401) {
      expireSession();
      throw new ApiError("Your session has expired. Please log in again.", { status: 401 });
    }
  }

  const { response, payload } = result;
  if (!response.ok || (payload && payload.success === false)) {
    throw toApiError(response.status, payload, response.headers);
  }
  return payload ?? { success: true };
}

/** Shorthands. Each resolves with the full envelope. */
export const api = {
  get: (path, options) => request(path, { ...options, method: "GET" }),
  post: (path, body, options) => request(path, { ...options, method: "POST", body }),
  put: (path, body, options) => request(path, { ...options, method: "PUT", body }),
  patch: (path, body, options) => request(path, { ...options, method: "PATCH", body }),
  delete: (path, options) => request(path, { ...options, method: "DELETE" }),
};

/** Resolve with `envelope.data` — the common case. */
export async function getData(path, options) {
  const envelope = await request(path, { ...options, method: options?.method ?? "GET" });
  return envelope.data;
}
