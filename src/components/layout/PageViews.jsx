import { useEffect } from "react";
import { useLocation } from "react-router";
import { trackPageView } from "../../lib/analytics";

/** Sends a page view on every route change (renders nothing). */
export function PageViews() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    trackPageView(`${pathname}${search}`);
  }, [pathname, search]);
  return null;
}
