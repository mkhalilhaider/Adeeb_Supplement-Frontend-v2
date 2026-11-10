import { NavLink, useMatch } from "react-router";
import { Heart, Home, LayoutGrid, Search, User } from "lucide-react";
import { cn } from "../../lib/cn";
import { useSession } from "../../features/auth/session-store";

/**
 * Bottom navigation for phones. Hidden on screens with their own sticky action bar
 * (product, cart, checkout) so the two never stack.
 */
export function MobileTabBar({ onSearch }) {
  const status = useSession((s) => s.status);
  const onProduct = useMatch("/product/:slug");
  const onCart = useMatch("/cart");
  const onCheckout = useMatch("/checkout");
  if (onProduct || onCart || onCheckout) return null;

  const item =
    "flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors";
  const tab = ({ isActive }) => cn(item, isActive ? "text-ink" : "text-ink-3");

  return (
    <nav
      aria-label="Quick navigation"
      className="fixed inset-x-0 bottom-0 z-40 flex h-[calc(3.5rem+env(safe-area-inset-bottom))] border-t border-line bg-paper pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <NavLink to="/" end className={tab}>
        <Home aria-hidden="true" className="size-5" /> Home
      </NavLink>
      <NavLink to="/shop" className={tab}>
        <LayoutGrid aria-hidden="true" className="size-5" /> Shop
      </NavLink>
      <button type="button" onClick={onSearch} className={cn(item, "text-ink-3")}>
        <Search aria-hidden="true" className="size-5" /> Search
      </button>
      <NavLink to="/wishlist" className={tab}>
        <Heart aria-hidden="true" className="size-5" /> Wishlist
      </NavLink>
      <NavLink to={status === "authenticated" ? "/account" : "/login"} className={tab}>
        <User aria-hidden="true" className="size-5" />{" "}
        {status === "authenticated" ? "Account" : "Log in"}
      </NavLink>
    </nav>
  );
}
