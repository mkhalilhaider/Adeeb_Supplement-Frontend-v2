/** Same rule the backend uses for emails. */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The backend's only password rule. */
export const MIN_PASSWORD = 8;

/** @returns {string} an error message, or "" when the password is acceptable */
export function passwordProblem(password) {
  if (!password) return "Choose a password";
  if (password.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters`;
  return "";
}
