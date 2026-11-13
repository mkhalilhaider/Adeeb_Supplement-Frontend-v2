import { Suspense, useCallback } from "react";
import { NavLink, Outlet, ScrollRestoration } from "react-router";
import {
  Award,
  BadgePercent,
  Bike,
  CircleX,
  ExternalLink,
  FileSpreadsheet,
  Film,
  Star,
  HeartHandshake,
  Inbox,
  LayoutDashboard,
  LogOut,
  Mail,
  Package,
  PanelLeftOpen,
  ShoppingCart,
  Tags,
  TextSearch,
  Timer,
} from "lucide-react";
import { Button } from "../ui/Button";
import { PageLoader } from "../ui/PageLoader";
import { SessionNotice } from "../../features/auth/SessionNotice";
import { useSession } from "../../features/auth/session-store";
import { useIdleLogout } from "../../features/admin/useIdleLogout";
import { cn } from "../../lib/cn";
import { useRouteScopedToggle } from "../../lib/hooks";

const NAV = [
  { group: null, links: [{ to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true }] },
  {
    group: "Sales",
    links: [
      { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
      { to: "/admin/abandoned", label: "Abandoned checkouts", icon: Timer },
      { to: "/admin/coupons", label: "Coupons", icon: BadgePercent },
      { to: "/admin/delivery", label: "Delivery fees", icon: Bike },
    ],
  },
  {
    group: "Catalog",
    links: [
      { to: "/admin/products", label: "Products", icon: Package },
      { to: "/admin/products/bulk", label: "Bulk upload", icon: FileSpreadsheet },
      { to: "/admin/categories", label: "Categories", icon: Tags },
      { to: "/admin/brands", label: "Brands", icon: Award },
    ],
  },
  {
    group: "Customers",
    links: [
      { to: "/admin/inquiries", label: "Inquiries", icon: Inbox },
      { to: "/admin/wishlists", label: "Wishlists", icon: HeartHandshake },
    ],
  },
  {
    group: "Content",
    links: [
      { to: "/admin/reels", label: "Reels", icon: Film },
      { to: "/admin/reviews", label: "Reviews", icon: Star },
      { to: "/admin/seo", label: "SEO", icon: TextSearch },
      { to: "/admin/marketing", label: "Marketing email", icon: Mail },
    ],
  },
];

function NavLinks() {
  return (
    <div className="flex flex-col gap-5">
      {NAV.map(({ group, links }) => (
        <div key={group ?? "main"}>
          {group && <p className="mb-1.5 px-3 label-caps text-ink-3">{group}</p>}
          <ul className="flex flex-col gap-0.5">
            {links.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end ?? to === "/admin/products"}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2.5 rounded-sm px-3 py-2 text-small font-medium transition-colors duration-(--duration-fast)",
                      isActive ? "bg-ink text-paper" : "text-ink-2 hover:bg-shelf hover:text-ink",
                    )
                  }
                >
                  <Icon aria-hidden="true" className="size-4" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/**
 * Admin shell: never indexed or cached, sidebar on desktop and a menu panel on phones, and an
 * automatic sign-out after 30 minutes without activity (with a one-minute warning).
 */
export default function AdminLayout() {
  const user = useSession((s) => s.user);
  const signOut = useSession((s) => s.signOut);
  const menu = useRouteScopedToggle();

  const onTimeout = useCallback(() => {
    signOut();
    useSession.setState({ loginNotice: "Signed out after 30 minutes without activity." });
  }, [signOut]);
  const idle = useIdleLogout({ onTimeout });

  return (
    <div className="flex min-h-dvh flex-col bg-paper lg:flex-row">
      <meta name="robots" content="noindex, nofollow" />
      <a
        href="#main"
        className="sr-only z-50 rounded-sm bg-ink px-4 py-2 text-paper focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>

      {/* Phones and tablets: top bar + menu panel */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-surface px-4 lg:hidden">
        <span className="label-caps text-ink-2">Adeeb · Admin</span>
        <button
          type="button"
          onClick={menu.toggle}
          aria-expanded={menu.open}
          aria-controls="admin-menu"
          className="flex size-10 items-center justify-center rounded-sm hover:bg-shelf"
        >
          {menu.open ? (
            <CircleX aria-hidden="true" className="size-5" />
          ) : (
            <PanelLeftOpen aria-hidden="true" className="size-5" />
          )}
          <span className="sr-only">{menu.open ? "Close menu" : "Open menu"}</span>
        </button>
      </header>

      <aside
        id="admin-menu"
        aria-label="Admin"
        className={cn(
          "border-line bg-surface lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-60 lg:shrink-0 lg:flex-col lg:border-r",
          menu.open ? "block border-b" : "hidden",
        )}
      >
        <div className="hidden h-16 items-center border-b border-line px-5 lg:flex">
          <span className="label-caps text-ink-2">Adeeb · Admin</span>
        </div>
        <nav aria-label="Admin sections" className="flex-1 overflow-y-auto p-3">
          <NavLinks />
        </nav>
        <div className="flex flex-col gap-1 border-t border-line p-3 text-small">
          <p className="truncate px-3 text-ink-3">{user?.email}</p>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 rounded-sm px-3 py-2 text-ink-2 hover:bg-shelf hover:text-ink"
          >
            <ExternalLink aria-hidden="true" className="size-4" /> View store
          </a>
          <button
            type="button"
            onClick={signOut}
            className="flex items-center gap-2.5 rounded-sm px-3 py-2 text-left text-ink-2 hover:bg-shelf hover:text-ink"
          >
            <LogOut aria-hidden="true" className="size-4" /> Sign out
          </button>
        </div>
      </aside>

      <main id="main" className="min-w-0 flex-1 p-4 md:p-6 lg:p-8">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>

      {idle.warning && (
        <div
          role="alertdialog"
          aria-modal="false"
          aria-labelledby="idle-title"
          aria-describedby="idle-text"
          className="fixed inset-x-4 bottom-4 z-50 rounded-md border border-ink bg-surface p-5 shadow-lg sm:left-auto sm:w-96"
        >
          <p id="idle-title" className="font-semibold">
            Still there?
          </p>
          <p id="idle-text" className="mt-1 text-small text-ink-2" aria-live="polite">
            For safety you'll be signed out in {idle.secondsLeft} seconds.
          </p>
          <div className="mt-4 flex gap-2">
            {/* eslint-disable-next-line jsx-a11y/no-autofocus -- the warning needs the keyboard's attention */}
            <Button onClick={idle.stay} autoFocus>
              Stay signed in
            </Button>
            <Button variant="outline" onClick={signOut}>
              Sign out now
            </Button>
          </div>
        </div>
      )}

      <SessionNotice />
      <ScrollRestoration />
    </div>
  );
}
