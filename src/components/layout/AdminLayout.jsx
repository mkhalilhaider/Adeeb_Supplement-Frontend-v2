import { Outlet, ScrollRestoration } from "react-router";
import { Suspense } from "react";
import { PageLoader } from "../ui/PageLoader";
import { SessionNotice } from "../../features/auth/SessionNotice";

/**
 * Admin shell (Phase 0): never indexed, never cached. Sidebar, top bar and idle auto-logout
 * arrive in Phase 8.
 */
export default function AdminLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <meta name="robots" content="noindex, nofollow" />
      <header className="border-b border-line">
        <div className="flex h-14 items-center px-4 lg:px-6">
          <span className="label-mono text-ink-2">Adeeb · Admin</span>
        </div>
      </header>
      <main id="main" className="flex-1 p-4 lg:p-6">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <SessionNotice />
      <ScrollRestoration />
    </div>
  );
}
