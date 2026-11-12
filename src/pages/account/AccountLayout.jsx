import { Suspense } from "react";
import { NavLink, Outlet } from "react-router";
import { LayoutDashboard, LogOut, MapPin, Package, Settings } from "lucide-react";
import { PageLoader } from "../../components/ui/PageLoader";
import { cn } from "../../lib/cn";
import { useSession } from "../../features/auth/session-store";

const LINKS = [
  { to: "/account", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/account/orders", label: "Orders", icon: Package },
  { to: "/account/addresses", label: "Addresses", icon: MapPin },
  { to: "/account/settings", label: "Settings", icon: Settings },
];

/**
 * Account area frame: section nav (a sidebar on desktop, a scrollable tab row on phones) and
 * log out. The pages render beside it.
 */
export default function AccountLayout() {
  const user = useSession((s) => s.user);
  const signOut = useSession((s) => s.signOut);

  // Leave the protected area first; signing out while still on it would bounce to /login.
  // The account guard sees the voluntary sign-out and sends the shopper home.
  const logOut = () => signOut();

  const linkClass = ({ isActive }) =>
    cn(
      "flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2.5 text-small font-semibold whitespace-nowrap transition-colors duration-(--duration-fast)",
      isActive ? "bg-ink text-white" : "text-ink-2 hover:bg-shelf hover:text-ink",
    );

  return (
    <div className="page-container pt-6 pb-16 md:pt-10">
      <p className="label-caps text-brand-ink">My account</p>
      <p className="mt-1 text-[2.25rem] font-display md:text-[2.75rem]">
        Hi, {user?.firstName || "there"}
      </p>

      <div className="mt-6 grid gap-6 md:mt-8 md:grid-cols-[13rem_1fr] md:gap-10">
        <nav
          aria-label="Account"
          className="-mx-4 md:mx-0 md:self-start md:rounded-card md:border md:border-line md:bg-surface md:p-2"
        >
          <ul className="flex [scrollbar-width:none] gap-1 overflow-x-auto px-4 md:flex-col md:px-0">
            {LINKS.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink to={to} end={end} className={linkClass}>
                  <Icon aria-hidden="true" className="size-4" />
                  {label}
                </NavLink>
              </li>
            ))}
            <li className="md:mt-4 md:border-t md:border-line md:pt-4">
              <button
                type="button"
                onClick={logOut}
                className="flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2.5 text-small font-semibold whitespace-nowrap text-ink-2 hover:bg-shelf hover:text-ink"
              >
                <LogOut aria-hidden="true" className="size-4" />
                Log out
              </button>
            </li>
          </ul>
        </nav>

        <div className="min-w-0">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
