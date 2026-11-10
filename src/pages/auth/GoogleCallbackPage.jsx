import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { PageLoader } from "../../components/ui/PageLoader";
import { tokenStorage } from "../../lib/api";
import { errorMessage } from "../../lib/api/errors";
import { fetchMe } from "../../features/auth/api";
import { AuthShell, FormNotice } from "../../features/auth/components/AuthShell";
import { GOOGLE_RETURN_KEY } from "../../features/auth/components/GoogleButton";
import { safeReturnTo } from "../../features/auth/lib/return-to";
import { useSession } from "../../features/auth/session-store";

/** Read and remove the tokens the backend put in the URL hash (never left in history). */
function takeTokensFromHash() {
  const hash = new URLSearchParams(window.location.hash.slice(1));
  const accessToken = hash.get("accessToken");
  const refreshToken = hash.get("refreshToken");
  if (window.location.hash) {
    window.history.replaceState(null, "", window.location.pathname);
  }
  return accessToken && refreshToken ? { accessToken, refreshToken } : null;
}

function takeReturnTo() {
  try {
    const value = sessionStorage.getItem(GOOGLE_RETURN_KEY);
    sessionStorage.removeItem(GOOGLE_RETURN_KEY);
    return safeReturnTo(value);
  } catch {
    return "/account";
  }
}

/**
 * The hash can be read only once, so the exchange runs once per page load and every effect
 * run (React runs effects twice in development) waits on the same result.
 * @type {Promise<{ user: any, tokens: any, returnTo: string } | null> | null}
 */
let exchange = null;

function exchangeTokens() {
  if (exchange) return exchange;
  const tokens = takeTokensFromHash();
  if (!tokens) return Promise.resolve(null);
  const returnTo = takeReturnTo();
  tokenStorage.save(tokens, "customer");
  exchange = fetchMe()
    .then((user) => ({ user, tokens, returnTo }))
    .catch((err) => {
      tokenStorage.clear();
      throw err;
    })
    .finally(() => {
      // Allow a later sign-in in the same page session.
      setTimeout(() => {
        exchange = null;
      }, 0);
    });
  return exchange;
}

/**
 * /auth/google/callback#accessToken=…&refreshToken=… — the backend's redirect after Google.
 * Stores the tokens, loads the user (the redirect carries no profile), then continues.
 */
export default function GoogleCallbackPage() {
  const navigate = useNavigate();
  const signIn = useSession((s) => s.signIn);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    exchangeTokens()
      .then((result) => {
        if (!active) return;
        if (result) {
          signIn(result);
          navigate(result.returnTo, { replace: true });
        } else if (tokenStorage.hasSession()) {
          // Reloaded after the hash was cleared: the session is already stored.
          navigate("/account", { replace: true });
        } else {
          setError("Google sign-in didn't complete. Please try again.");
        }
      })
      .catch((err) => {
        if (active) setError(errorMessage(err));
      });
    return () => {
      active = false;
    };
  }, [navigate, signIn]);

  if (!error) return <PageLoader label="Signing you in" />;
  return (
    <AuthShell title="Sign-in failed" seoTitle="Sign in">
      <div className="flex flex-col gap-4">
        <FormNotice>{error}</FormNotice>
        <Link to="/login" className="font-semibold underline">
          Back to log in
        </Link>
      </div>
    </AuthShell>
  );
}
