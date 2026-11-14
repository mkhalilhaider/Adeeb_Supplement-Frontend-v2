import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { ArrowRight, MapPin, MessageCircle, Package, Repeat, Truck, Users } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { CloudImage } from "../../components/ui/CloudImage";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { site, whatsappLink } from "../../config/site";
import { useInViewOnce } from "../../lib/hooks";
import { usePrefersReducedMotion } from "../../lib/useMediaQuery";
import { useTaxonomy } from "../catalog/useTaxonomy";
import { fetchStorefrontStats } from "./api";
import { contentImageSrc, cutoutSrc, HERO_PACKS } from "./hero-packs";
import { useHomepageContent } from "./useHomepageContent";
import { Odometer } from "./Odometer";
import { DEFAULT_SPOTLIGHT } from "./homepage-defaults";

const FEATURE = { ...DEFAULT_SPOTLIGHT, pack: HERO_PACKS[0] };

/**
 * One dark editorial band after Best sellers. Its content comes from Admin → Homepage content
 * (spotlight); until that is set, it features Creatine with the category's own description.
 */
export function EditorialBand() {
  const { categories } = useTaxonomy();
  const spot = useHomepageContent().data?.spotlight;
  const category = categories.find((c) => c.slug === FEATURE.slug);
  const band = spot
    ? { ...spot, src: contentImageSrc(spot, 400) }
    : category && {
        href: `/category/${category.slug}`,
        eyebrow: category.name,
        title: FEATURE.title,
        description: category.description,
        buttonText: `Shop ${category.name.toLowerCase()}`,
        src: cutoutSrc(FEATURE.pack.id, 400),
      };
  if (!band) return null;
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
          {band.src && (
            <img
              src={band.src}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-[220px] w-auto drop-shadow-[0_24px_30px_rgb(0_0_0/0.6)] md:h-[320px]"
            />
          )}
        </div>
        <div className="flex flex-col justify-center gap-5 p-7 md:p-10 lg:p-14">
          {band.eyebrow && <p className="label-caps text-brand">{band.eyebrow}</p>}
          <h2
            id="feature-heading"
            className="text-[2.75rem] font-display md:text-[3.25rem] lg:text-[4rem]"
          >
            {band.title}
          </h2>
          {band.description && (
            <p className="max-w-[46ch] text-[17px] leading-relaxed text-night-muted">
              {band.description}
            </p>
          )}
          <div className="mt-2 grid gap-3 sm:flex sm:flex-wrap">
            {band.href &&
              (band.href.startsWith("/") ? (
                <Button to={band.href} size="lg">
                  {band.buttonText || "Shop now"}
                </Button>
              ) : (
                <Button href={band.href} target="_blank" rel="noopener" size="lg">
                  {band.buttonText || "Shop now"}
                </Button>
              ))}
            <Button to="/brands" size="lg" variant="onDark">
              Compare brands
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Brand logos in one row that slides by itself (pauses on hover; still for reduced motion). */
export function BrandsGrid() {
  const { brands } = useTaxonomy();
  if (!brands.length) return null;
  const tile = (b, copy) => (
    <li key={`${copy}-${b._id}`} aria-hidden={copy ? "true" : undefined}>
      <Link
        to={`/brand/${b.slug}`}
        aria-label={b.name}
        tabIndex={copy ? -1 : undefined}
        className="group flex h-24 w-44 items-center justify-center rounded-card border border-line bg-surface px-5 py-4 md:h-28 md:w-52"
      >
        {b.logoUrl ? (
          <CloudImage
            src={b.logoUrl}
            alt=""
            ratio={null}
            trim
            blend
            sizes="200px"
            className="h-full w-full"
            imgClassName="transition-transform duration-(--duration-base) group-hover:scale-105"
          />
        ) : (
          <span className="text-center text-small font-semibold">{b.name}</span>
        )}
      </Link>
    </li>
  );
  return (
    <section aria-labelledby="brands-heading">
      <div className="page-container">
        <SectionHeading
          id="brands-heading"
          eyebrow="Only the real thing"
          title={`${brands.length} trusted brands`}
          action={{ label: "All brands", to: "/brands" }}
        />
      </div>
      <div className="group/marquee relative mt-7 [scrollbar-width:none] overflow-x-auto motion-safe:overflow-hidden">
        <ul className="flex w-max gap-3 px-4 motion-safe:animate-[marquee_45s_linear_infinite] motion-safe:group-hover/marquee:[animation-play-state:paused] md:px-8">
          {brands.map((b) => tile(b, 0))}
          {brands.map((b) => tile(b, 1))}
        </ul>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 hidden w-24 bg-gradient-to-r from-paper to-transparent motion-safe:block md:w-40"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-24 bg-gradient-to-l from-paper to-transparent motion-safe:block md:w-40"
        />
      </div>
    </section>
  );
}

const STAT_ICONS = { orders: Package, parcels: Truck, customers: Users, repeat: Repeat };

/** Real counters from the backend; numbers that are still zero are left out. */
export function StatsBand() {
  const stats = useQuery({
    queryKey: ["storefront-stats"],
    queryFn: ({ signal }) => fetchStorefrontStats({ signal }),
    staleTime: 10 * 60_000,
  });
  const reduced = usePrefersReducedMotion();
  const [ref, seen] = useInViewOnce({ rootMargin: "0px 0px -15% 0px" });
  const rolled = reduced || seen;
  const d = stats.data;
  const items = [
    {
      id: "orders",
      value: d?.orders,
      show: `${d?.orders}+`,
      label: "Orders placed",
      note: "and counting, every day",
    },
    {
      id: "parcels",
      value: d?.deliveredParcels,
      show: `${d?.deliveredParcels}+`,
      label: "Parcels delivered",
      note: "Karachi riders & courier",
    },
    {
      id: "customers",
      value: d?.customers,
      show: `${d?.customers}+`,
      label: "Customers served",
      note: "across Pakistan",
    },
    {
      id: "repeat",
      value: d?.repeatedCustomers,
      show: `${d?.repeatedCustomers}+`,
      label: "Repeat customers",
      note: "ordered from us again",
    },
  ].filter((i) => i.value > 0);
  if (!items.length) return null;
  return (
    <section ref={ref} aria-labelledby="stats-heading" className="page-container">
      <div className="relative overflow-hidden rounded-band bg-night px-6 py-9 text-night-text md:px-11 md:py-11">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-32 size-[420px] rounded-full bg-[radial-gradient(closest-side,rgb(243_107_39/0.22),transparent)]"
        />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="label-caps text-brand">Since we opened</p>
            <h2 id="stats-heading" className="mt-2 text-[2.25rem] font-display md:text-[3.25rem]">
              Karachi keeps coming back.
            </h2>
          </div>
          <Button
            to="/shop?sort=bestselling"
            trailingIcon={<ArrowRight aria-hidden="true" className="size-4" />}
          >
            Shop best sellers
          </Button>
        </div>
        <dl className="relative mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {items.map((i) => {
            const Icon = STAT_ICONS[i.id];
            const highlight = i.id === "repeat";
            return (
              <div
                key={i.id}
                className={
                  highlight
                    ? "flex flex-col gap-3 rounded-card border border-brand/40 bg-[linear-gradient(160deg,rgb(243_107_39/0.18),var(--color-night-2)_60%)] p-5 md:p-6"
                    : "flex flex-col gap-3 rounded-card border border-night-line bg-night-2 p-5 md:p-6"
                }
              >
                <span className="flex size-12 items-center justify-center rounded-xl bg-brand/15 text-brand">
                  <Icon aria-hidden="true" className="size-6" />
                </span>
                <dd className="order-2 text-[2.75rem] font-display text-white tabular-nums md:text-[4rem]">
                  <span className="sr-only">{i.show}</span>
                  <Odometer value={i.show} rolled={rolled} />
                </dd>
                <dt className="order-3 flex flex-col gap-0.5">
                  <span className="text-[15px] font-bold text-white">{i.label}</span>
                  <span className="text-[13px] text-night-muted">{i.note}</span>
                </dt>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}

/**
 * The shop in Karachi: address, directions, WhatsApp and the live Google map.
 * @param {{ eyebrow?: string, title?: string }} props
 */
export function StoreBand({ eyebrow = site.store.label, title = "Come see it on the shelf." }) {
  return (
    <section aria-labelledby="store-heading" className="page-container">
      <div className="grid overflow-hidden rounded-band border border-line bg-surface md:grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col gap-4 p-7 md:p-12">
          <p className="label-caps text-brand-ink">{eyebrow}</p>
          <h2 id="store-heading" className="text-[2.5rem] font-display md:text-[3.5rem]">
            {title}
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
          </div>
        </div>
        <div className="relative min-h-[300px] border-t border-line bg-shelf md:border-t-0 md:border-l">
          <iframe
            title={`Map: ${site.name}, ${site.store.address}`}
            src={site.google.mapEmbedUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 size-full border-0"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  );
}
