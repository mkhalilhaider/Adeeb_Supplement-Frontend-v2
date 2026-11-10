import { api, getData } from "../../lib/api";

/** @typedef {import("../../types").SessionUser} SessionUser */
/** @typedef {import("../../types").AuthResult} AuthResult */

/** @returns {Promise<SessionUser>} */
export const fetchMe = ({ signal } = {}) => getData("/auth/me", { signal });

/** @returns {Promise<AuthResult>} */
export const login = (body) => getData("/auth/login", { method: "POST", body });

/** @returns {Promise<AuthResult>} */
export const register = (body) => getData("/auth/register", { method: "POST", body });

/**
 * Logs out this device only (its refresh token). Tokens are passed explicitly because local
 * storage is cleared first, so the UI never waits on the network.
 */
export const logout = ({ accessToken, refreshToken }) =>
  api.post(
    "/auth/logout",
    { refreshToken },
    { auth: false, headers: { Authorization: `Bearer ${accessToken}` } },
  );

/** Always succeeds (the backend never reveals whether an email has an account). */
export const requestPasswordReset = (email) =>
  api.post("/auth/forgot-password", { email }, { auth: false });

/** Sets a new password from the emailed token. Logs out every device. */
export const resetPassword = ({ token, password }) =>
  api.post("/auth/reset-password", { token, password }, { auth: false });

/** Confirms the address from the verification email. */
export const verifyEmail = (token, { signal } = {}) =>
  api.get("/auth/verify-email", { query: { token }, auth: false, signal });
