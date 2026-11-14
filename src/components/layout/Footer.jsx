import { Link } from "react-router";
import { ArrowRight, Banknote, House, ShieldCheck, Zap } from "lucide-react";
import { BrandIcon, WhatsAppIcon } from "../ui/BrandIcons";
import { site, whatsappLink } from "../../config/site";
import { useTaxonomy } from "../../features/catalog/useTaxonomy";
import { Logo } from "./Logo";

const TRUST_ICONS = { authentic: ShieldCheck, sameday: Zap, cod: Banknote, store: House };

const help = [
  { to: "/track-order", label: "Track your order" },
  { to: "/contact", label: "Contact us" },
  { to: "/about", label: "About" },
  { to: "/account", label: "My account" },
  { to: "/refund-policy", label: "Policies" },
];

const legal = [
  { to: "/privacy", label: "Privacy" },
  { to: "/terms", label: "Terms" },
  { to: "/refund-policy", label: "Refund policy" },
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

/** Picks the configured slugs in order (top 5), falling back to the first ones available. */
function topFive(items, slugs) {
  const bySlug = new Map(items.map((i) => [i.slug, i]));
  const picked = slugs.map((s) => bySlug.get(s)).filter(Boolean);
  return (picked.length ? picked : items).slice(0, 5);
}

export function Footer() {
  const { categories, brands } = useTaxonomy();
  const socials = [
    ["Instagram", site.social.instagram],
    ["Facebook", site.social.facebook],
    ["TikTok", site.social.tiktok],
    ["YouTube", site.social.youtube],
    ["WhatsApp", whatsappLink()],
  ];

  return (
    <footer className="overflow-hidden bg-night-deep text-night-text">
      <div className="page-container pt-12 md:pt-14">
        <div className="relative flex flex-col gap-5 overflow-hidden rounded-band bg-brand px-6 py-7 text-ink md:flex-row md:items-center md:justify-between md:px-9">
          <span
            aria-hidden="true"
            className="absolute -top-16 right-64 hidden size-56 rounded-full border-2 border-ink/15 md:block"
          />
          <div className="relative">
            <p className="label-caps">Real people, fast replies</p>
            <p className="mt-2 text-[2rem] font-display md:text-[2.75rem]">
              Not sure which supplement fits your goal?
            </p>
          </div>
          <div className="relative flex flex-none flex-col gap-2.5 sm:flex-row">
            <a
              href={whatsappLink("Hi Adeeb Supplement, which supplement is right for my goal?")}
              target="_blank"
              rel="noopener noreferrer"
              className="glide inline-flex h-13 items-center justify-center rounded-md bg-ink px-6 font-bold text-white hover:bg-[#262626] active:scale-[0.97]"
            >
              <span className="glide-label">
                <span className="glide-icon" aria-hidden="true">
                  <WhatsAppIcon />
                </span>
                Ask on WhatsApp
              </span>
            </a>
            <Link
              to="/track-order"
              className="glide inline-flex h-13 items-center justify-center rounded-md px-6 font-bold ring-[1.5px] ring-ink ring-inset hover:bg-ink/10 active:scale-[0.97]"
            >
              <span className="glide-label">
                <span className="glide-icon glide-auto" aria-hidden="true">
                  →
                </span>
                Track your order
              </span>
            </Link>
          </div>
        </div>

        <ul className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {site.trust.map((t) => {
            const Icon = TRUST_ICONS[t.id] ?? ShieldCheck;
            return (
              <li
                key={t.id}
                className="flex h-14 items-center gap-3 rounded-card border border-night-line bg-night px-4 text-small font-bold"
              >
                <Icon aria-hidden="true" className="size-5 flex-none text-brand" />
                {t.title}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="page-container grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.3fr]">
        <div className="sm:col-span-2 lg:col-span-1">
          <Logo inverted />
          <p className="mt-4 max-w-xs text-small text-night-muted">
            Authentic supplements at affordable prices — imported for Pakistan since April 2026.
          </p>
          <ul className="mt-5 flex gap-2.5">
            {socials.map(([label, href]) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  title={label}
                  className="flex size-11 items-center justify-center rounded-full border border-night-line text-night-text transition-colors duration-(--duration-base) hover:border-brand hover:bg-brand hover:text-ink"
                >
                  <BrandIcon name={label} className="size-[18px]" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <Column title="Shop by category">
          {topFive(categories, site.footer.categories).map((c) => (
            <li key={c._id}>
              <Link to={`/category/${c.slug}`} className={linkClass}>
                {c.name}
              </Link>
            </li>
          ))}
          <li>
            <Link
              to="/shop"
              className="inline-flex items-center gap-1 text-brand hover:text-brand-hover"
            >
              All categories <ArrowRight aria-hidden="true" className="size-3.5" />
            </Link>
          </li>
        </Column>

        <Column title="Shop by brand">
          {topFive(brands, site.footer.brands).map((b) => (
            <li key={b._id}>
              <Link to={`/brand/${b.slug}`} className={linkClass}>
                {b.name}
              </Link>
            </li>
          ))}
          <li>
            <Link
              to="/brands"
              className="inline-flex items-center gap-1 text-brand hover:text-brand-hover"
            >
              All {brands.length || ""} brands{" "}
              <ArrowRight aria-hidden="true" className="size-3.5" />
            </Link>
          </li>
        </Column>

        <Column title="Help">
          {help.map((item) => (
            <li key={item.label}>
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
        <div className="page-container flex flex-col gap-3 py-5 text-[13px] text-night-muted md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {site.name}. All prices in PKR.
          </p>
          <ul className="flex gap-5">
            {legal.map((item) => (
              <li key={item.label}>
                <Link to={item.to} className="hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Decorative outline wordmark. The words come from CSS (data-text) rather than the page
          text, so screen readers and contrast checks skip it. */}
      <p
        aria-hidden="true"
        data-text="Adeeb Supplement"
        className="pointer-events-none mt-2 overflow-hidden text-center text-[10.8vw] font-display leading-[0.8] whitespace-nowrap text-transparent select-none [-webkit-text-stroke:1.5px_#2e2e2e] before:content-[attr(data-text)] lg:text-[11.5vw] 2xl:text-[176px]"
      />
    </footer>
  );
}
