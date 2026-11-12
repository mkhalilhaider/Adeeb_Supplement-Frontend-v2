import { Link, NavLink } from "react-router";
import { InlineSearch } from "./InlineSearch";
import { Heart, Menu, Search, ShoppingBag, User } from "lucide-react";
import { IconButton } from "../ui/Button";
import { Logo } from "./Logo";
import { BrandsMenu } from "./BrandsMenu";
import { site, whatsappLink } from "../../config/site";
import { cn } from "../../lib/cn";
import { formatPrice } from "../../lib/format";
import { useSession } from "../../features/auth/session-store";
import { useTaxonomy } from "../../features/catalog/useTaxonomy";
import { useCart } from "../../features/cart/useCart";
import { selectWishlistCount, useWishlist } from "../../features/wishlist/wishlist-store";

/*
 * Store header, three rows on charcoal:
 *   1. utility bar   — owner-confirmed trust claims, order tracking, WhatsApp, store (md+)
 *   2. main row      — logo, search, account, wishlist, cart (sticky)
 *   3. category row  — real categories from the cached taxonomy + brands (sticky, lg+)
 * On phones the category row becomes a swipeable chip strip that scrolls away with the page,
 * so the sticky part stays one compact 56px bar.
 */

function CountBadge({ count }) {
  if (!count) return null;
  return (
    <span
      aria-hidden="true"
      className="absolute top-1 right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-white px-1 text-[11px] font-extrabold text-ink tabular-nums"
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
      title="Wishlist"
      className="relative hidden size-11 items-center justify-center rounded-md hover:bg-night-2 md:flex"
    >
      <Heart aria-hidden="true" className="size-[22px]" />
      <CountBadge count={count} />
    </Link>
  );
}

function CartLink() {
  const { count, subtotal } = useCart();
  return (
    <Link
      to="/cart"
      aria-label={count ? `Cart, ${count} item${count === 1 ? "" : "s"}` : "Cart, empty"}
      className={cn(
        "relative flex h-11 items-center gap-2 rounded-md transition-colors duration-(--duration-fast)",
        "w-11 justify-center md:w-auto md:bg-brand md:px-3.5 md:text-ink md:hover:bg-brand-hover",
      )}
    >
      <ShoppingBag aria-hidden="true" className="size-[22px]" />
      <span aria-hidden="true" className="hidden text-small font-extrabold md:inline">
        Cart{count ? ` · ${count}` : ""}
      </span>
      {count > 0 && subtotal > 0 && (
        <span aria-hidden="true" className="hidden text-small font-semibold opacity-80 xl:inline">
          {formatPrice(subtotal)}
        </span>
      )}
      <span className="md:hidden">
        <CountBadge count={count} />
      </span>
    </Link>
  );
}

function AccountLink() {
  const status = useSession((s) => s.status);
  const user = useSession((s) => s.user);
  const signedIn = status === "authenticated";
  return (
    <Link
      to={signedIn ? "/account" : "/login"}
      className="hidden h-11 items-center gap-2.5 rounded-md px-2.5 hover:bg-night-2 md:flex"
    >
      <User aria-hidden="true" className="size-[22px]" />
      <span className="hidden flex-col leading-tight xl:flex">
        <span className="text-[12px] text-night-muted">
          {signedIn ? `Hi, ${user?.firstName ?? "there"}` : "Hello, sign in"}
        </span>
        <span className="text-small font-bold">{signedIn ? "Your account" : "Account"}</span>
      </span>
      <span className="sr-only xl:hidden">{signedIn ? "Your account" : "Log in"}</span>
    </Link>
  );
}

function UtilityBar() {
  return (
    <div className="hidden bg-night-deep text-night-muted md:block">
      <div className="page-container flex h-9 items-center justify-between gap-6 text-[13px]">
        <p className="flex items-center gap-6">
          <span className="flex items-center gap-2">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-brand" />
            Authentic brands — sourced, never repacked
          </span>
          <span className="hidden items-center gap-2 lg:flex">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-brand" />
            Cash on delivery nationwide
          </span>
        </p>
        <p className="flex items-center gap-5">
          <Link to="/track-order" className="hover:text-white">
            Track your order
          </Link>
          <a href={whatsappLink()} className="hover:text-white">
            WhatsApp {site.contact.phoneDisplay}
          </a>
          <a
            href={site.store.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="hidden hover:text-white lg:inline"
          >
            Store · {site.store.area}
          </a>
        </p>
      </div>
    </div>
  );
}

const catLink = ({ isActive }) =>
  cn(
    "flex h-12 items-center border-b-2 text-small font-semibold whitespace-nowrap transition-colors duration-(--duration-fast)",
    isActive
      ? "border-brand text-white"
      : "border-transparent text-night-muted hover:border-brand hover:text-white",
  );

function CategoryNav() {
  const { categories, isPending } = useTaxonomy();
  return (
    <nav aria-label="Categories" className="relative hidden border-t border-night-line lg:block">
      <div className="page-container flex items-center gap-7">
        <NavLink to="/shop" end className={catLink}>
          Shop all
        </NavLink>
        {isPending
          ? Array.from({ length: 7 }, (_, i) => (
              <span key={i} aria-hidden="true" className="h-3 w-20 rounded-sm bg-night-2" />
            ))
          : categories.map((c) => (
              <NavLink key={c._id} to={`/category/${c.slug}`} className={catLink}>
                {c.name}
              </NavLink>
            ))}
        <BrandsMenu />
        <span className="ml-auto flex items-center gap-6">
          <Link
            to="/shop?featured=1"
            className="flex h-12 items-center text-small font-semibold text-brand hover:text-brand-hover"
          >
            Featured picks
          </Link>
          <Link
            to="/shop?sort=newest"
            className="flex h-12 items-center text-small font-semibold text-night-muted hover:text-white"
          >
            New arrivals
          </Link>
        </span>
      </div>
    </nav>
  );
}

/** Phones and tablets: categories as a swipeable chip strip under the bar (not sticky). */
function CategoryChips() {
  const { categories } = useTaxonomy();
  if (!categories.length) return null;
  const chip =
    "flex h-9 flex-none items-center rounded-full px-3.5 text-small font-semibold whitespace-nowrap";
  return (
    <nav aria-label="Categories" className="bg-night lg:hidden">
      <div className="flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 pb-3 md:px-6">
        <NavLink
          to="/shop"
          end
          className={({ isActive }) =>
            cn(chip, isActive ? "bg-brand text-ink" : "bg-night-2 text-night-text")
          }
        >
          Shop all
        </NavLink>
        {categories.map((c) => (
          <NavLink
            key={c._id}
            to={`/category/${c.slug}`}
            className={({ isActive }) =>
              cn(chip, isActive ? "bg-brand text-ink" : "bg-night-2 text-night-text")
            }
          >
            {c.name}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export function Header({ onOpenMenu, onOpenSearch }) {
  return (
    <>
      <UtilityBar />
      <header className="sticky top-0 z-30 bg-night text-night-text">
        <div className="page-container flex h-14 items-center gap-2 md:h-[72px] md:gap-6 lg:gap-10">
          <IconButton
            label="Open menu"
            onClick={onOpenMenu}
            className="-ml-2 text-night-text hover:bg-night-2 lg:hidden"
          >
            <Menu aria-hidden="true" className="size-6" />
          </IconButton>
          <Logo inverted />
          <div className="ml-auto hidden w-full max-w-md md:block lg:ml-0 lg:max-w-xl xl:max-w-2xl">
            <InlineSearch />
          </div>
          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <IconButton
              label="Search"
              onClick={onOpenSearch}
              className="text-night-text hover:bg-night-2 md:hidden"
            >
              <Search aria-hidden="true" className="size-[22px]" />
            </IconButton>
            <AccountLink />
            <WishlistLink />
            <CartLink />
          </div>
        </div>
        <CategoryNav />
      </header>
      <CategoryChips />
    </>
  );
}
