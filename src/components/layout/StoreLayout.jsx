import { lazy, Suspense, useState } from "react";
import { PageViews } from "./PageViews";
import { Outlet, ScrollRestoration } from "react-router";
import { PageLoader } from "../ui/PageLoader";
import { SessionNotice } from "../../features/auth/SessionNotice";
import { Header } from "./Header";
import { useCartUi } from "../../features/cart/cart-ui";
import { useSession } from "../../features/auth/session-store";

// Overlays load on first use: most visits never open them, so their drawer/dialog code
// stays off the critical path.
// Always below the fold: loads right after the page instead of with it.
const Footer = lazy(() => import("./Footer").then((m) => ({ default: m.Footer })));
// Phone tab bar: fixed to the bottom of the screen, so loading it a moment after the page moves
// nothing (its space is kept by the spacer below the footer). Hidden on computers.
const MobileTabBar = lazy(() =>
  import("./MobileTabBar").then((m) => ({ default: m.MobileTabBar })),
);
// Floating WhatsApp button + promo popup: one small download right after the page.
const StoreExtras = lazy(() => import("./StoreExtras"));
const MobileMenu = lazy(() => import("./MobileMenu").then((m) => ({ default: m.MobileMenu })));
// Guest → account cart merge and wishlist push: only logged-in shoppers download it.
const SessionSync = lazy(() =>
  import("../../features/cart/SessionSync").then((m) => ({ default: m.SessionSync })),
);
const CartDrawer = lazy(() => import("../../features/cart/components/CartDrawer"));
const QuickAddSheet = lazy(() => import("../../features/cart/components/QuickAddSheet"));
const SearchOverlay = lazy(() =>
  import("../../features/search/SearchOverlay").then((m) => ({ default: m.SearchOverlay })),
);

/** Shopper layout: header, page, footer; phones also get the bottom tab bar. */
export default function StoreLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mounted, setMounted] = useState({ menu: false, search: false });
  const loggedIn = useSession((s) => s.status === "authenticated");
  // Cart drawer / options sheet mount on first use and stay mounted (for close animations).
  const drawerOpen = useCartUi((s) => s.drawerOpen);
  const quickAddSlug = useCartUi((s) => s.quickAddSlug);
  const [cartUiUsed, setCartUiUsed] = useState({ drawer: false, quickAdd: false });
  if ((drawerOpen && !cartUiUsed.drawer) || (quickAddSlug && !cartUiUsed.quickAdd)) {
    setCartUiUsed({
      drawer: cartUiUsed.drawer || drawerOpen,
      quickAdd: cartUiUsed.quickAdd || Boolean(quickAddSlug),
    });
  }
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

      {/* At least a screen tall: the footer stays below the fold while content loads (no layout shift). */}
      <main id="main" className="min-h-svh flex-1">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>

      <Suspense fallback={null}>
        <Footer />
      </Suspense>
      {/* Keeps the end of the footer clear of the phone tab bar. */}
      <div aria-hidden="true" className="h-[calc(3.5rem+env(safe-area-inset-bottom))] md:hidden" />

      <Suspense fallback={null}>
        <MobileTabBar onSearch={openSearch} />
        <StoreExtras />
      </Suspense>
      <Suspense fallback={null}>
        {mounted.menu && <MobileMenu open={menuOpen} onOpenChange={setMenuOpen} />}
        {mounted.search && <SearchOverlay open={searchOpen} onOpenChange={setSearchOpen} />}
        {cartUiUsed.drawer && <CartDrawer />}
        {cartUiUsed.quickAdd && <QuickAddSheet />}
      </Suspense>
      <SessionNotice />
      {loggedIn && (
        <Suspense fallback={null}>
          <SessionSync />
        </Suspense>
      )}
      <PageViews />
      <ScrollRestoration />
    </div>
  );
}
