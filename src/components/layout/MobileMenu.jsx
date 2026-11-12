import { Link } from "react-router";
import {
  ChevronRight,
  Heart,
  MessageCircle,
  PackageSearch,
  Phone,
  Store,
  User,
} from "lucide-react";
import { Sheet } from "../ui/Sheet";
import { CloudImage } from "../ui/CloudImage";
import { site, whatsappLink } from "../../config/site";
import { useTaxonomy } from "../../features/catalog/useTaxonomy";
import { useSession } from "../../features/auth/session-store";
import { selectWishlistCount, useWishlist } from "../../features/wishlist/wishlist-store";

const quick =
  "flex h-12 items-center justify-center gap-2 rounded-md border border-line text-small font-bold";

/** Phone menu: quick actions, categories with images, brands, help. Slides in from the left. */
export function MobileMenu({ open, onOpenChange }) {
  const { categories } = useTaxonomy();
  const close = () => onOpenChange(false);
  const signedIn = useSession((s) => s.status) === "authenticated";
  const saved = useWishlist(selectWishlistCount);

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Menu" side="left" alwaysSide>
      <div className="mb-6 grid grid-cols-2 gap-2">
        <Link to={signedIn ? "/account" : "/login"} onClick={close} className={quick}>
          <User aria-hidden="true" className="size-[18px]" />
          {signedIn ? "Your account" : "Log in"}
        </Link>
        <Link to="/wishlist" onClick={close} className={quick}>
          <Heart aria-hidden="true" className="size-[18px]" />
          Wishlist{saved ? ` · ${saved}` : ""}
        </Link>
        <Link to="/track-order" onClick={close} className={quick}>
          <PackageSearch aria-hidden="true" className="size-[18px]" />
          Track order
        </Link>
        <a
          href={whatsappLink("Hi Adeeb Supplement, I have a question.")}
          className="flex h-12 items-center justify-center gap-2 rounded-md bg-brand text-small font-extrabold text-ink"
        >
          <MessageCircle aria-hidden="true" className="size-[18px]" />
          WhatsApp us
        </a>
      </div>
      <nav aria-label="Shop">
        <p className="label-caps text-ink-3">Shop by category</p>
        <ul className="mt-3 grid grid-cols-2 gap-2">
          {categories.map((c) => (
            <li key={c._id}>
              <Link
                to={`/category/${c.slug}`}
                onClick={close}
                className="flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface"
              >
                <CloudImage
                  src={c.imageUrl}
                  alt=""
                  ratio="landscape"
                  sizes="45vw"
                  blend
                  className="m-2"
                />
                <span className="px-2.5 pb-2.5 text-small font-semibold">{c.name}</span>
              </Link>
            </li>
          ))}
        </ul>

        <ul className="mt-5 border-t border-line">
          {[
            { to: "/shop", label: "All products" },
            { to: "/brands", label: "All brands A–Z" },
            { to: "/shop?featured=1", label: "Featured picks" },
          ].map((item) => (
            <li key={item.to} className="border-b border-line">
              <Link
                to={item.to}
                onClick={close}
                className="flex items-center justify-between py-3.5 font-semibold"
              >
                {item.label}
                <ChevronRight aria-hidden="true" className="size-4 text-ink-3" />
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-6">
        <p className="label-caps text-ink-3">Help</p>
        <ul className="mt-2 flex flex-col">
          <li>
            <a href={`tel:${site.contact.phoneIntl}`} className="flex items-center gap-3 py-2.5">
              <Phone aria-hidden="true" className="size-5 text-ink-2" /> Call{" "}
              {site.contact.phoneDisplay}
            </a>
          </li>
          <li>
            <a
              href={site.store.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-start gap-3 py-2.5"
            >
              <Store aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ink-2" />
              <span>
                Visit our store
                <span className="block text-small text-ink-3">{site.store.area}</span>
              </span>
            </a>
          </li>
        </ul>
      </div>
    </Sheet>
  );
}
