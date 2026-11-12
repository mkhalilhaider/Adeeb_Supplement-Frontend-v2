import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { ArrowRight, MapPin, MessageCircle, Phone } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { CloudImage } from "../../components/ui/CloudImage";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { site, whatsappLink } from "../../config/site";
import { useTaxonomy } from "../catalog/useTaxonomy";
import { fetchStorefrontStats } from "./api";
import { cutoutSrc, HERO_PACKS } from "./hero-packs";

const FEATURE = { slug: "creatine", title: "Strength starts with creatine.", pack: HERO_PACKS[0] };

/** One dark editorial band for a single category (copy = the category's own description). */
export function EditorialBand() {
  const { categories } = useTaxonomy();
  const category = categories.find((c) => c.slug === FEATURE.slug);
  if (!category) return null;
  return (
    <section aria-labelledby="feature-heading" className="page-container">
      <div className="grid overflow-hidden rounded-band bg-night text-night-text md:grid-cols-2">
        <div
          className="flex items-center justify-center bg-night-deep py-10 md:py-0"
          style={{
            backgroundImage:
              "radial-gradient(55% 55% at 50% 60%, rgb(243 107 39 / 0.42), rgb(243 107 39 / 0) 70%)",
          }}
        >
          <img
            src={cutoutSrc(FEATURE.pack.id, 400)}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-[220px] w-auto drop-shadow-[0_24px_30px_rgb(0_0_0/0.6)] md:h-[320px]"
          />
        </div>
        <div className="flex flex-col justify-center gap-5 p-7 md:p-14">
          <p className="label-caps text-brand">{category.name}</p>
          <h2 id="feature-heading" className="text-[2.75rem] font-display md:text-[4rem]">
            {FEATURE.title}
          </h2>
          {category.description && (
            <p className="max-w-[46ch] text-[17px] leading-relaxed text-night-muted">
              {category.description}
            </p>
          )}
          <div className="mt-2 grid gap-3 sm:flex">
            <Button to={`/category/${category.slug}`} size="lg">
              Shop {category.name.toLowerCase()}
            </Button>
            <Button to="/brands" size="lg" variant="onDark">
              Compare brands
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

const BRAND_TILES = 14;

/** Brand logos (grey until hovered), linking to the brand page. */
export function BrandsGrid() {
  const { brands } = useTaxonomy();
  if (!brands.length) return null;
  return (
    <section aria-labelledby="brands-heading" className="page-container">
      <SectionHeading
        id="brands-heading"
        eyebrow="Only the real thing"
        title={`${brands.length} trusted brands`}
        action={{ label: "All brands", to: "/brands" }}
      />
      <ul className="mt-7 grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-7 lg:gap-3">
        {brands.slice(0, BRAND_TILES).map((b) => (
          <li key={b._id}>
            <Link
              to={`/brand/${b.slug}`}
              aria-label={b.name}
              className="group flex h-20 items-center justify-center rounded-card border border-line bg-surface px-4 py-3 transition-colors duration-(--duration-fast) hover:border-ink md:h-24"
            >
              {b.logoUrl ? (
                <CloudImage
                  src={b.logoUrl}
                  alt=""
                  ratio={null}
                  trim
                  blend
                  sizes="140px"
                  className="h-full w-full"
                  imgClassName="opacity-80 grayscale transition duration-(--duration-base) group-hover:opacity-100 group-hover:grayscale-0"
                />
              ) : (
                <span className="text-center text-small font-semibold">{b.name}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

const STAT_FORMAT = new Intl.NumberFormat("en-PK");

/** Real counters from the backend; numbers that are still zero are left out. */
export function StatsBand() {
  const stats = useQuery({
    queryKey: ["storefront-stats"],
    queryFn: ({ signal }) => fetchStorefrontStats({ signal }),
    staleTime: 10 * 60_000,
  });
  const d = stats.data;
  const returnRate =
    d?.customers > 0 && d?.repeatedCustomers > 0
      ? Math.max(2, Math.round(d.customers / d.repeatedCustomers))
      : 0;
  const items = [
    { value: d?.orders, show: `${STAT_FORMAT.format(d?.orders ?? 0)}+`, label: "Orders placed" },
    {
      value: d?.deliveredParcels,
      show: `${STAT_FORMAT.format(d?.deliveredParcels ?? 0)}+`,
      label: "Parcels delivered",
    },
    {
      value: d?.customers,
      show: `${STAT_FORMAT.format(d?.customers ?? 0)}+`,
      label: "Customers served",
    },
    { value: returnRate, show: `1 in ${returnRate}`, label: "Customers order again" },
  ].filter((i) => i.value > 0);
  if (!items.length) return null;
  return (
    <section aria-labelledby="stats-heading" className="page-container">
      <div className="grid gap-8 rounded-band bg-night px-6 py-9 text-night-text md:px-12 md:py-11 lg:grid-cols-[1.1fr_3fr] lg:items-center">
        <div>
          <p className="label-caps text-brand">Since we opened</p>
          <h2 id="stats-heading" className="mt-2 text-[2.25rem] font-display md:text-[2.75rem]">
            Karachi keeps coming back.
          </h2>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-7 md:grid-cols-4">
          {items.map((i) => (
            <div
              key={i.label}
              className="flex flex-col-reverse gap-1.5 md:border-l md:border-night-line md:pl-6"
            >
              <dt className="text-small text-night-muted">{i.label}</dt>
              <dd className="text-[2.75rem] font-display text-white tabular-nums md:text-[3.75rem]">
                {i.show}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/** The walk-in store: address, directions, call and WhatsApp. */
export function StoreBand() {
  return (
    <section aria-labelledby="store-heading" className="page-container">
      <div className="grid overflow-hidden rounded-band border border-line bg-surface md:grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col gap-4 p-7 md:p-12">
          <p className="label-caps text-brand-ink">{site.store.label}</p>
          <h2 id="store-heading" className="text-[2.5rem] font-display md:text-[3.5rem]">
            Come see it on the shelf.
          </h2>
          <p className="flex max-w-[52ch] items-start gap-2 text-ink-2">
            <MapPin aria-hidden="true" className="mt-1 size-4.5 shrink-0 text-brand-ink" />
            {site.store.address}
          </p>
          <div className="mt-2 grid gap-2.5 sm:flex sm:flex-wrap">
            <Button
              href={site.store.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="secondary"
              size="lg"
              leadingIcon={<MapPin aria-hidden="true" className="size-4" />}
            >
              Get directions
            </Button>
            <Button
              href={whatsappLink("Hi Adeeb Supplement, I have a question.")}
              target="_blank"
              rel="noopener noreferrer"
              size="lg"
              leadingIcon={<MessageCircle aria-hidden="true" className="size-4" />}
            >
              WhatsApp us
            </Button>
            <Button
              href={`tel:${site.contact.phoneIntl}`}
              variant="outline"
              size="lg"
              leadingIcon={<Phone aria-hidden="true" className="size-4" />}
            >
              {site.contact.phoneDisplay}
            </Button>
          </div>
        </div>
        <a
          href={site.store.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${site.store.area} store in Google Maps`}
          className="group relative hidden min-h-[300px] items-center justify-center md:flex"
          style={{
            backgroundColor: "#f7f5f1",
            backgroundImage:
              "radial-gradient(60% 60% at 50% 50%, rgb(243 107 39 / 0.18), rgb(243 107 39 / 0)), repeating-linear-gradient(0deg, #ebe7e0 0 1px, transparent 1px 40px), repeating-linear-gradient(90deg, #ebe7e0 0 1px, transparent 1px 40px)",
          }}
        >
          <span className="flex size-14 items-center justify-center rounded-full bg-brand text-ink ring-[12px] ring-brand/20 transition-transform duration-(--duration-base) group-hover:scale-110">
            <MapPin aria-hidden="true" className="size-6" />
          </span>
          <span className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-1.5 text-small font-bold whitespace-nowrap">
            {site.store.area} <ArrowRight aria-hidden="true" className="size-4" />
          </span>
        </a>
      </div>
    </section>
  );
}
