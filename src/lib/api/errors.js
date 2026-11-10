/**
 * One error type for every failed API call, so UI code can branch on meaning
 * (network, timeout, unauthorised, conflict…) instead of parsing messages.
 */
export class ApiError extends Error {
  /**
   * @param {string} message  Human-readable message (backend message for 4xx, friendly text otherwise)
   * @param {object} [info]
   * @param {number} [info.status]       HTTP status, 0 for network/timeout
   * @param {"http"|"network"|"timeout"} [info.kind]
   * @param {unknown} [info.payload]     Parsed response body, if any
   * @param {number|null} [info.retryAfter] Seconds, from RateLimit headers on 429
   */
  constructor(message, { status = 0, kind = "http", payload = null, retryAfter = null } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.kind = kind;
    this.payload = payload;
    this.retryAfter = retryAfter;
  }

  get isNetwork() {
    return this.kind === "network";
  }
  get isTimeout() {
    return this.kind === "timeout";
  }
  get isUnauthorized() {
    return this.status === 401;
  }
  get isForbidden() {
    return this.status === 403;
  }
  get isNotFound() {
    return this.status === 404;
  }
  get isConflict() {
    return this.status === 409;
  }
  get isRateLimited() {
    return this.status === 429;
  }
  get isClientError() {
    return this.status >= 400 && this.status < 500;
  }
  get isServerError() {
    return this.status >= 500;
  }
  /** Worth retrying automatically (never for 4xx — the request itself is wrong). */
  get isRetryable() {
    return this.isNetwork || this.isTimeout || this.isServerError;
  }
}

const FALLBACK = {
  0: "Can't reach the server. Check your connection and try again.",
  400: "Please check the details and try again.",
  401: "Please log in to continue.",
  403: "You don't have access to this.",
  404: "We couldn't find what you were looking for.",
  409: "This changed in the meantime. Please review and try again.",
  413: "That file or request is too large.",
  429: "Too many attempts. Please wait a moment and try again.",
  500: "Something went wrong on our side. Please try again.",
  502: "A connected service is not responding. Please try again shortly.",
  503: "This service is temporarily unavailable. Please try again shortly.",
};

export function fallbackMessage(status) {
  if (FALLBACK[status]) return FALLBACK[status];
  if (status >= 500) return FALLBACK[500];
  if (status >= 400) return FALLBACK[400];
  return FALLBACK[0];
}

function readRetryAfter(headers) {
  const raw = headers?.get?.("retry-after") ?? headers?.get?.("ratelimit-reset");
  const seconds = Number(raw);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

/**
 * Build an ApiError from a failed HTTP response. 4xx messages from the backend are written
 * for humans, so they are shown as-is; 5xx messages are replaced (the backend only says
 * "Internal server error", which isn't helpful to a shopper).
 */
export function toApiError(status, payload, headers) {
  const backendMessage =
    payload && typeof payload === "object" && typeof payload.message === "string"
      ? payload.message.trim()
      : "";
  const useBackend = backendMessage && status >= 400 && status < 500;
  return new ApiError(useBackend ? backendMessage : fallbackMessage(status), {
    status,
    kind: "http",
    payload,
    retryAfter: status === 429 ? readRetryAfter(headers) : null,
  });
}

/** Message to show for any thrown value (ApiError, plain Error, or unknown). */
export function errorMessage(error) {
  if (error instanceof ApiError) return error.message;
  if (error?.name === "AbortError") return "";
  return fallbackMessage(500);
}
