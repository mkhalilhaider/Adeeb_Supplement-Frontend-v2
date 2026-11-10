import { logout } from "../../features/auth/api";

export { ApiError, errorMessage } from "../../lib/api";

/** Revoke a session we don't want to keep (e.g. non-admin credentials on the admin login). */
export async function logoutQuietly(tokens) {
  try {
    await logout(tokens);
  } catch {
    /* the refresh token expires on its own */
  }
}
