import { useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router";
import { login } from "../../features/auth/api";
import { selectIsAdmin, useSession } from "../../features/auth/session-store";
import { ApiError, errorMessage, logoutQuietly } from "./admin-auth";

/** Only allow internal admin paths as a post-login destination (no open redirects). */
function safeReturnTo(value) {
  return typeof value === "string" && value.startsWith("/admin") && !value.startsWith("//")
    ? value
    : "/admin";
}

/**
 * Separate admin sign-in: email + password only (no Google, no registration link).
 * Admin sessions are kept in sessionStorage, so closing the browser signs the admin out.
 * Phase 0 version — restyled with the design-system form components in Phase 8.
 */
export default function AdminLoginPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const signIn = useSession((s) => s.signIn);
  const isAdmin = useSession(selectIsAdmin);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const returnTo = safeReturnTo(params.get("returnTo"));

  if (isAdmin) return <Navigate to={returnTo} replace />;

  async function onSubmit(event) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    setError("");
    setPending(true);
    try {
      const result = await login({
        email: String(form.get("email") ?? "").trim(),
        password: String(form.get("password") ?? ""),
      });
      if (result.user.role !== "admin") {
        // Valid customer credentials, but not an admin: don't keep that session here.
        await logoutQuietly(result.tokens);
        setError("This account doesn't have admin access.");
        return;
      }
      signIn(result, "admin");
      navigate(returnTo, { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError && err.isUnauthorized
          ? "Incorrect email or password."
          : errorMessage(err),
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper px-4">
      <title>Admin sign in | Adeeb Supplement</title>
      <meta name="robots" content="noindex, nofollow" />
      <form onSubmit={onSubmit} className="w-full max-w-sm" noValidate={false}>
        <p className="label-mono text-ink-3">Adeeb · Admin</p>
        <h1 className="mt-2 text-h1 font-extrabold uppercase font-condensed">Sign in</h1>

        <label className="mt-8 block text-small font-medium" htmlFor="admin-email">
          Email
        </label>
        <input
          id="admin-email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className="mt-1.5 h-12 w-full rounded-sm border border-line-strong bg-surface px-3 outline-none focus-visible:border-ink"
        />

        <label className="mt-4 block text-small font-medium" htmlFor="admin-password">
          Password
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1.5 h-12 w-full rounded-sm border border-line-strong bg-surface px-3 outline-none focus-visible:border-ink"
        />

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-sm bg-danger-soft px-3 py-2 text-small text-danger"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-6 h-12 w-full rounded-md bg-ink font-semibold text-paper transition-opacity duration-(--duration-fast) disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
