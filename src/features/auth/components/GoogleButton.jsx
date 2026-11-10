import { env } from "../../../config/env";
import { safeReturnTo } from "../lib/return-to";

export const GOOGLE_RETURN_KEY = "adeeb.google-return";

/**
 * "Continue with Google": a full-page trip to the backend, which sends the shopper back to
 * /auth/google/callback with tokens. Hidden unless VITE_GOOGLE_AUTH_ENABLED=true (the backend
 * answers 503 when its Google keys aren't set).
 */
export function GoogleButton({ returnTo, label = "Continue with Google" }) {
  if (!env.googleAuthEnabled) return null;
  const start = () => {
    try {
      sessionStorage.setItem(GOOGLE_RETURN_KEY, safeReturnTo(returnTo));
    } catch {
      /* falls back to the account page */
    }
    window.location.assign(`${env.apiUrl}/auth/google`);
  };
  return (
    <>
      <button
        type="button"
        onClick={start}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-md border border-line-strong bg-surface font-semibold text-ink transition-colors duration-(--duration-fast) hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5">
          <path
            fill="#EA4335"
            d="M12 10.2v3.9h5.4c-.2 1.3-1.6 3.9-5.4 3.9-3.3 0-5.9-2.7-5.9-6s2.6-6 5.9-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12Z"
          />
        </svg>
        {label}
      </button>
      <div className="my-6 flex items-center gap-3 text-small text-ink-3" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>
    </>
  );
}
