import { Link, Outlet, ScrollRestoration } from "react-router";
import { Suspense } from "react";
import { site } from "../../config/site";
import { PageLoader } from "../ui/PageLoader";
import { SessionNotice } from "../../features/auth/SessionNotice";

/**
 * Shopper layout. Phase 0 shell: header/footer structure and landmarks only — the real header
 * (navigation, mega-menu, search, cart, mobile tab bar) is built in Phase 2.
 */
export default function StoreLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only z-50 rounded-sm bg-ink px-4 py-2 text-paper focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>

      <header className="border-b border-line bg-paper">
        <div className="page-container flex h-16 items-center">
          <Link to="/" className="flex items-baseline gap-1.5" aria-label={`${site.name} home`}>
            <span className="text-[22px] font-extrabold tracking-wide font-condensed">ADEEB</span>
            <span className="label-mono text-[10px] tracking-[0.24em] text-brand-ink">
              Supplement
            </span>
          </Link>
        </div>
      </header>

      <main id="main" className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>

      <footer className="bg-night text-night-text">
        <div className="page-container py-10 text-small text-night-muted">
          © {new Date().getFullYear()} {site.name} · {site.store.area}
        </div>
      </footer>

      <SessionNotice />
      <ScrollRestoration />
    </div>
  );
}
