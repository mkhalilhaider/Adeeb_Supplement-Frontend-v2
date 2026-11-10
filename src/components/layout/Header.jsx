import { Link, NavLink } from "react-router";
import { Heart, Menu, Search, ShoppingBag, User } from "lucide-react";
import { IconButton } from "../ui/Button";
import { Logo } from "./Logo";
import { BrandsMenu } from "./BrandsMenu";
import { site, whatsappLink } from "../../config/site";
import { cn } from "../../lib/cn";
import { useSession } from "../../features/auth/session-store";
import { useTaxonomy } from "../../features/catalog/useTaxonomy";
import { SearchCombobox } from "../../features/search/SearchCombobox";
import { useCart } from "../../features/cart/useCart";
import { selectWishlistCount, useWishlist } from "../../features/wishlist/wishlist-store";

/** Small count badge shared by the wishlist and cart icons. */
function CountBadge({ count }) {
  if (!count) return null;
  return (
    <span
      aria-hidden="true"
      className="absolute top-1 right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-[11px] font-bold text-ink tabular-nums"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function WishlistLink() {
  const count = useWishlist(selectWishlistCount);
  return (
    <Link
      to="/wishlist"
      aria-label={count ? `Wishlist, ${count} saved` : "Wishlist"}
      className="relative hidden size-11 items-center justify-center rounded-md hover:bg-shelf md:flex"
    >
      <Heart aria-hidden="true" className="size-5" />
      <CountBadge count={count} />
    </Link>
  );
}

/** Cart icon with a live count badge. */
function CartLink() {
  const { count } = useCart();
  return (
    <Link
      to="/cart"
      aria-label={count ? `Cart, ${count} item${count === 1 ? "" : "s"}` : "Cart, empty"}
      className="relative -mr-2 flex size-11 items-center justify-center rounded-md hover:bg-shelf md:mr-0"
    >
      <ShoppingBag aria-hidden="true" className="size-5" />
      <CountBadge count={count} />
    </Link>
  );
}

/** Thin bar above the header: the three facts that matter most for trust (desktop/tablet). */
function UtilityBar() {
  return (
    <div className="hidden bg-night text-night-text md:block">
      <div className="page-container flex h-8 items-center justify-between">
        <p className="label-mono text-night-muted">
          Cash on delivery nationwide · Authentic brands only
        </p>
        <p className="flex gap-5 label-mono text-night-muted">
          <a
            href={site.store.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="hover:text-paper"
          >
            Store · {site.store.area}
          </a>
          <a href={whatsappLink()} className="hover:text-paper">
            WhatsApp {site.contact.phoneDisplay}
          </a>
        </p>
      </div>
    </div>
  );
}

/** Row of categories + Brands menu (desktop). Scrolls away; the main bar above stays. */
function CategoryNav() {
  const { categories, isPending } = useTaxonomy();
  const link = ({ isActive }) =>
    cn(
      "flex h-11 items-center border-b-2 text-small font-semibold whitespace-nowrap transition-colors",
      isActive ? "border-ink text-ink" : "border-transparent text-ink-2 hover:text-ink",
    );

  return (
    <nav aria-label="Categories" className="relative hidden border-b border-line bg-paper lg:block">
      <div className="page-container flex items-center gap-6">
        <NavLink to="/shop" end className={link}>
          All products
        </NavLink>
        {isPending
          ? Array.from({ length: 6 }, (_, i) => (
              <span key={i} aria-hidden="true" className="h-3 w-20 rounded-sm bg-shelf" />
            ))
          : categories.map((c) => (
              <NavLink key={c._id} to={`/category/${c.slug}`} className={link}>
                {c.name}
              </NavLink>
            ))}
        <BrandsMenu />
      </div>
    </nav>
  );
}

/**
 * Site header.
 * Phones: menu · logo · search · cart (plus the bottom tab bar).
 * Desktop: logo · search field · account · wishlist · cart, with the category row below.
 */
export function Header({ onOpenMenu, onOpenSearch }) {
  const status = useSession((s) => s.status);
  const user = useSession((s) => s.user);
  const accountHref = status === "authenticated" ? "/account" : "/login";

  return (
    <>
      <UtilityBar />
      <header className="sticky top-0 z-30 border-b border-line bg-paper">
        <div className="page-container flex h-14 items-center gap-2 md:h-16 md:gap-6">
          <IconButton label="Open menu" onClick={onOpenMenu} className="-ml-2 lg:hidden">
            <Menu aria-hidden="true" className="size-6" />
          </IconButton>

          <Logo />

          <div className="ml-auto hidden w-full max-w-md md:block lg:ml-6 lg:max-w-lg">
            <SearchCombobox variant="inline" />
          </div>

          <div className="ml-auto flex items-center md:ml-0">
            <IconButton label="Search" onClick={onOpenSearch} className="md:hidden">
              <Search aria-hidden="true" className="size-5" />
            </IconButton>
            <Link
              to={accountHref}
              className="hidden h-11 items-center gap-2 rounded-md px-3 text-small font-semibold hover:bg-shelf md:flex"
            >
              <User aria-hidden="true" className="size-5" />
              <span className="hidden xl:inline">
                {status === "authenticated" ? `Hi, ${user?.firstName ?? "there"}` : "Log in"}
              </span>
              <span className="sr-only xl:hidden">
                {status === "authenticated" ? "Your account" : "Log in"}
              </span>
            </Link>
            <WishlistLink />
            <CartLink />
          </div>
        </div>
      </header>
      <CategoryNav />
    </>
  );
}
