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
