import { Link } from "react-router";
import { site, whatsappLink } from "../../config/site";
import { useTaxonomy } from "../../features/catalog/useTaxonomy";
import { Logo } from "./Logo";

const help = [
  { to: "/track-order", label: "Track your order" },
  { to: "/contact", label: "Contact us" },
  { to: "/refund-policy", label: "Returns & refunds" },
  { to: "/about", label: "About Adeeb Supplement" },
];

const account = [
  { to: "/login", label: "Log in" },
  { to: "/register", label: "Create an account" },
  { to: "/account/orders", label: "My orders" },
  { to: "/wishlist", label: "Wishlist" },
];

const legal = [
  { to: "/privacy", label: "Privacy" },
  { to: "/terms", label: "Terms" },
];

function Column({ title, children }) {
  return (
    <div>
      <h2 className="label-caps text-night-muted">{title}</h2>
      <ul className="mt-4 flex flex-col gap-2.5 text-small">{children}</ul>
    </div>
  );
}

const linkClass = "text-night-text/85 transition-colors hover:text-brand";

/** Site footer: one dark band, four columns on desktop, stacked on phones. */
export function Footer() {
  const { categories } = useTaxonomy();
  const socials = [
    ["Instagram", site.social.instagram],
    ["Facebook", site.social.facebook],
    ["TikTok", site.social.tiktok],
    ["YouTube", site.social.youtube],
  ];

  return (
    <footer className="bg-night-deep text-night-text">
      <div className="page-container grid gap-10 py-12 md:grid-cols-2 md:py-16 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1.4fr]">
        <div>
          <Logo inverted />
          <p className="mt-4 max-w-xs text-small text-night-muted">
            Authentic sports nutrition, delivered across Pakistan. Trusted brands — sourced, never
            repacked.
          </p>
          <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-small">
            {socials.map(([label, href]) => (
              <li key={label}>
                <a href={href} target="_blank" rel="noreferrer" className={linkClass}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <Column title="Shop">
          <li>
            <Link to="/shop" className={linkClass}>
              All products
            </Link>
          </li>
          {categories.map((c) => (
            <li key={c._id}>
              <Link to={`/category/${c.slug}`} className={linkClass}>
                {c.name}
              </Link>
            </li>
          ))}
          <li>
            <Link to="/brands" className={linkClass}>
              Brands A–Z
            </Link>
          </li>
        </Column>

        <Column title="Help">
          {help.map((item) => (
            <li key={item.to}>
              <Link to={item.to} className={linkClass}>
                {item.label}
              </Link>
            </li>
          ))}
        </Column>

        <Column title="Account">
          {account.map((item) => (
            <li key={item.to}>
              <Link to={item.to} className={linkClass}>
                {item.label}
              </Link>
            </li>
          ))}
        </Column>
        <Column title="Visit the store">
          <li className="text-night-text/85">{site.store.address}</li>
          <li>
            <a href={site.store.mapsUrl} target="_blank" rel="noreferrer" className={linkClass}>
              Open in Google Maps
            </a>
          </li>
          <li>
            <a href={whatsappLink()} className={linkClass}>
              WhatsApp {site.contact.phoneDisplay}
            </a>
          </li>
          <li>
            <a href={`mailto:${site.contact.email}`} className={linkClass}>
              {site.contact.email}
            </a>
          </li>
        </Column>
      </div>

      <div className="border-t border-night-line">
        <div className="page-container flex flex-col gap-3 py-5 text-[12px] text-night-muted md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {site.name}. All prices in PKR.
          </p>
          <ul className="flex gap-5">
            {legal.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="hover:text-paper">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
