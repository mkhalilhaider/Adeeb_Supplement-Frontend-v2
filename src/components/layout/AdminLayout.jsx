import { Suspense, useCallback, useEffect, useState } from "react";
import { NavLink, Outlet, ScrollRestoration, useLocation } from "react-router";
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
  LayoutTemplate,
  Mail,
  Megaphone,
  MessageCircle,
  Package,
  PanelLeftClose,
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
      { to: "/admin/homepage", label: "Homepage", icon: LayoutTemplate },
      { to: "/admin/reels", label: "Reels", icon: Film },
      { to: "/admin/reviews", label: "Reviews", icon: Star },
      { to: "/admin/promo-popup", label: "Promo popup", icon: Megaphone },
      { to: "/admin/whatsapp", label: "WhatsApp button", icon: MessageCircle },
      { to: "/admin/seo", label: "SEO", icon: TextSearch },
      { to: "/admin/marketing", label: "Marketing email", icon: Mail },
    ],
  },
];

/** Remembers whether the desktop sidebar is collapsed (icons only). */
const COLLAPSE_KEY = "adeeb.admin-sidebar";
const readCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
};

function NavLinks({ collapsed }) {
  return (
    <div className="flex flex-col gap-5">
      {NAV.map(({ group, links }) => (
        <div key={group ?? "main"}>
          {group && (
            <p
              className={cn(
                "mb-1.5 px-3 label-caps whitespace-nowrap text-ink-3",
                collapsed && "lg:sr-only",
              )}
            >
              {group}
            </p>
          )}
          <ul className="flex flex-col gap-0.5">
            {links.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  title={collapsed ? label : undefined}
                  end={end ?? to === "/admin/products"}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2.5 rounded-sm px-3 py-2 text-small font-medium whitespace-nowrap transition-colors duration-(--duration-fast)",
                      collapsed && "lg:justify-center lg:px-0",
                      isActive ? "bg-ink text-paper" : "text-ink-2 hover:bg-shelf hover:text-ink",
                    )
                  }
                >
                  <Icon aria-hidden="true" className="size-4 shrink-0" />
                  <span className={cn(collapsed && "lg:sr-only")}>{label}</span>
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
  const { pathname } = useLocation();
  // Keep the current section visible in the sidebar (the list scrolls on short screens).
  useEffect(() => {
    document
      .querySelector('#admin-menu nav [aria-current="page"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [pathname]);
  // Desktop: the sidebar can shrink to icons only (remembered on this device).
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const toggleCollapsed = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1");
      } catch {
        /* not remembered: fine */
      }
      return !c;
    });
  };

  const onTimeout = useCallback(() => {
    signOut();
    useSession.setState({ loginNotice: "Signed out after 30 minutes without activity." });
  }, [signOut]);
  const idle = useIdleLogout({ onTimeout });

  return (
    <div
      className="flex min-h-dvh flex-col bg-paper lg:flex-row"
      // Width of the desktop sidebar, for anything fixed beside it (e.g. save bars).
      style={{ "--admin-sidebar": collapsed ? "4rem" : "15rem" }}
    >
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
          "border-line bg-surface lg:sticky lg:top-0 lg:flex lg:h-dvh lg:shrink-0 lg:flex-col lg:border-r lg:transition-[width] lg:duration-(--duration-base)",
          collapsed ? "lg:w-16" : "lg:w-60",
          menu.open ? "block border-b" : "hidden",
        )}
      >
        <div
          className={cn(
            "hidden h-16 items-center border-b border-line lg:flex",
            collapsed ? "justify-center px-2" : "justify-between pr-2 pl-5",
          )}
        >
          {!collapsed && (
            <span className="label-caps whitespace-nowrap text-ink-2">Adeeb · Admin</span>
          )}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-expanded={!collapsed}
            aria-controls="admin-menu"
            title={collapsed ? "Open menu" : "Close menu"}
            className="flex size-10 items-center justify-center rounded-sm text-ink-2 transition-colors hover:bg-shelf hover:text-ink"
          >
            {collapsed ? (
              <PanelLeftOpen aria-hidden="true" className="size-5" />
            ) : (
              <PanelLeftClose aria-hidden="true" className="size-5" />
            )}
            <span className="sr-only">{collapsed ? "Open menu" : "Close menu"}</span>
          </button>
        </div>
        <nav aria-label="Admin sections" className="flex-1 overflow-x-hidden overflow-y-auto p-3">
          <NavLinks collapsed={collapsed} />
        </nav>
        <div className="flex flex-col gap-1 border-t border-line p-3 text-small">
          <p className={cn("truncate px-3 text-ink-3", collapsed && "lg:sr-only")}>{user?.email}</p>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            title={collapsed ? "View store" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-sm px-3 py-2 whitespace-nowrap text-ink-2 hover:bg-shelf hover:text-ink",
              collapsed && "lg:justify-center lg:px-0",
            )}
          >
            <ExternalLink aria-hidden="true" className="size-4 shrink-0" />
            <span className={cn(collapsed && "lg:sr-only")}>View store</span>
          </a>
          <button
            type="button"
            onClick={signOut}
            title={collapsed ? "Sign out" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-sm px-3 py-2 text-left whitespace-nowrap text-ink-2 hover:bg-shelf hover:text-ink",
              collapsed && "lg:justify-center lg:px-0",
            )}
          >
            <LogOut aria-hidden="true" className="size-4 shrink-0" />
            <span className={cn(collapsed && "lg:sr-only")}>Sign out</span>
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
