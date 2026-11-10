import { lazy, Suspense, useState } from "react";
import { Outlet, ScrollRestoration } from "react-router";
import { PageLoader } from "../ui/PageLoader";
import { SessionNotice } from "../../features/auth/SessionNotice";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { MobileTabBar } from "./MobileTabBar";

// Overlays load on first use: most visits never open them, so their drawer/dialog code
// stays off the critical path.
const MobileMenu = lazy(() => import("./MobileMenu").then((m) => ({ default: m.MobileMenu })));
const SearchOverlay = lazy(() =>
  import("../../features/search/SearchOverlay").then((m) => ({ default: m.SearchOverlay })),
);

/** Shopper layout: header, page, footer; phones also get the bottom tab bar. */
export default function StoreLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mounted, setMounted] = useState({ menu: false, search: false });
  const openMenu = () => {
    setMounted((m) => ({ ...m, menu: true }));
    setMenuOpen(true);
  };
  const openSearch = () => {
    setMounted((m) => ({ ...m, search: true }));
    setSearchOpen(true);
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only z-50 rounded-sm bg-ink px-4 py-2 text-paper focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>

      <Header onOpenMenu={openMenu} onOpenSearch={openSearch} />

      <main id="main" className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>

      <Footer />
      {/* Keeps the end of the footer clear of the phone tab bar. */}
      <div aria-hidden="true" className="h-[calc(3.5rem+env(safe-area-inset-bottom))] md:hidden" />

      <MobileTabBar onSearch={openSearch} />
      <Suspense fallback={null}>
        {mounted.menu && <MobileMenu open={menuOpen} onOpenChange={setMenuOpen} />}
        {mounted.search && <SearchOverlay open={searchOpen} onOpenChange={setSearchOpen} />}
      </Suspense>
      <SessionNotice />
      <ScrollRestoration />
    </div>
  );
}
