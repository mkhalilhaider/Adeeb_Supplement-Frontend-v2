import { Link } from "react-router";
import { ChevronRight, MessageCircle, PackageSearch, Phone, Store } from "lucide-react";
import { Sheet } from "../ui/Sheet";
import { CloudImage } from "../ui/CloudImage";
import { site, whatsappLink } from "../../config/site";
import { useTaxonomy } from "../../features/catalog/useTaxonomy";

/** Phone menu: categories with images, brands, help. Slides in from the left. */
export function MobileMenu({ open, onOpenChange }) {
  const { categories } = useTaxonomy();
  const close = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Menu" side="left" alwaysSide>
      <nav aria-label="Shop">
        <p className="label-mono text-ink-3">Shop by category</p>
        <ul className="mt-3 grid grid-cols-2 gap-2">
          {categories.map((c) => (
            <li key={c._id}>
              <Link
                to={`/category/${c.slug}`}
                onClick={close}
                className="flex h-full flex-col overflow-hidden rounded-sm bg-shelf"
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
        <p className="label-mono text-ink-3">Help</p>
        <ul className="mt-2 flex flex-col">
          <li>
            <Link to="/track-order" onClick={close} className="flex items-center gap-3 py-2.5">
              <PackageSearch aria-hidden="true" className="size-5 text-ink-2" /> Track your order
            </Link>
          </li>
          <li>
            <a
              href={whatsappLink("Hi Adeeb Supplement, I have a question.")}
              className="flex items-center gap-3 py-2.5"
            >
              <MessageCircle aria-hidden="true" className="size-5 text-ink-2" /> WhatsApp{" "}
              {site.contact.phoneDisplay}
            </a>
          </li>
          <li>
            <a href={`tel:${site.contact.phoneIntl}`} className="flex items-center gap-3 py-2.5">
              <Phone aria-hidden="true" className="size-5 text-ink-2" /> Call us
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
