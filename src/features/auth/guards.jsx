import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { selectIsAdmin, useSession } from "./session-store";
import { PageLoader } from "../../components/ui/PageLoader";
import NotFoundPage from "../../pages/store/NotFoundPage";

/** Customer area: guests are sent to login and brought back afterwards. */
export function RequireAuth() {
  const status = useSession((s) => s.status);
  const signedOut = useSession((s) => s.signedOut);
  const location = useLocation();

  if (status === "unknown") return <PageLoader label="Checking your session" />;
  // Just logged out from inside the account area: go home rather than to the login form.
  if (status !== "authenticated" && signedOut) return <Navigate to="/" replace />;
  if (status !== "authenticated") {
    const returnTo = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }
  return <Outlet />;
}

/**
 * Admin area. Always re-checks the role with the backend on entry (never trusts the cached
 * snapshot). Signed-out visitors go to the admin login; signed-in non-admins see the regular
 * 404 page, so the route's existence isn't confirmed.
 */
export function RequireAdmin() {
  const status = useSession((s) => s.status);
  const isAdmin = useSession(selectIsAdmin);
  const verify = useSession((s) => s.verify);
  const location = useLocation();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let active = true;
    if (status === "guest") return undefined;
    verify({ force: true })
      .catch(() => {})
      .finally(() => active && setChecked(true));
    return () => {
      active = false;
    };
  }, [status, verify]);

  if (status === "guest") {
    const returnTo = `${location.pathname}${location.search}`;
    return <Navigate to={`/admin/login?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }
  if (!checked || status === "unknown") return <PageLoader label="Verifying access" />;
  if (!isAdmin) return <NotFoundPage />;
  return <Outlet />;
}
