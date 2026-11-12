import { useId, useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Banknote, House, ShieldCheck, Truck } from "lucide-react";
import { CloudImage } from "../../components/ui/CloudImage";
import { Skeleton } from "../../components/ui/Skeleton";
import { site } from "../../config/site";
import { cn } from "../../lib/cn";
import { RailList } from "../catalog/components/ProductRail";
import { toProductCard } from "../catalog/lib/product-view";
import { useProducts } from "../catalog/queries";
import { useTaxonomy } from "../catalog/useTaxonomy";
import { cutoutSrc, LEAD_PACK } from "./hero-packs";

const TRUST_ICONS = { authentic: ShieldCheck, cod: Banknote, delivery: Truck, store: House };

/** The four owner-confirmed promises, right under the hero. */
export function TrustStrip() {
  return (
    <section aria-label="Why shop with us" className="border-b border-line bg-surface">
      <ul className="page-container grid grid-cols-2 lg:grid-cols-4">
        {site.trust.map((point, i) => {
          const Icon = TRUST_ICONS[point.id] ?? ShieldCheck;
          return (
            <li
              key={point.id}
              className={cn(
                "flex items-center gap-3 py-4 md:py-6",
                i % 2 === 1 && "pl-4 md:pl-7",
                i > 0 && "lg:border-l lg:border-line lg:pl-7",
                i > 1 && "border-t border-line lg:border-t-0",
              )}
            >
              <Icon aria-hidden="true" className="size-6 flex-none text-brand-ink md:size-7" />
              <span className="leading-tight">
                <strong className="block text-small font-extrabold md:text-[15px]">
                  {point.title}
                </strong>
                <span className="text-[13px] text-ink-3">{point.detail}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * Each category framed as a customer goal. Goals map one-to-one to real categories (the shop
 * filters by one category at a time); a category without a goal keeps its own name.
 */
const GOALS = {
  protein: "Build muscle",
  creatine: "Strength & power",
  preworkout: "Energy & focus",
  "mass-gainer": "Gain size",
  "fat-burner": "Get lean",
  "bcaa-eaa": "Recover faster",
  "health-recovery": "Daily health",
};
const GOAL_ORDER = Object.keys(GOALS);

export function GoalTiles() {
  const { categories, isPending } = useTaxonomy();
  const tiles = useMemo(
    () =>
      [...categories].sort(
        (a, b) => (GOAL_ORDER.indexOf(a.slug) + 1 || 99) - (GOAL_ORDER.indexOf(b.slug) + 1 || 99),
      ),
    [categories],
  );
  const [lead, ...rest] = tiles;

  return (
    <section id="goals" aria-labelledby="goals-heading" className="page-container scroll-mt-32">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="label-caps text-brand-ink">Start with your goal</p>
          <h2
            id="goals-heading"
            className="mt-2 text-[2.5rem] font-display md:text-[3.25rem] lg:text-[4rem]"
          >
            Shop by goal
          </h2>
        </div>
        <Link
          to="/shop"
          className="hidden items-center gap-1.5 pb-1 font-bold hover:text-brand-ink sm:inline-flex"
        >
          All products <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>

      {isPending && !tiles.length ? (
        <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-44 rounded-card md:h-60" />
          ))}
        </div>
      ) : (
        <ul className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:grid-rows-[250px_250px] lg:gap-4">
          {lead && (
            <li className="col-span-2 lg:col-span-1 lg:row-span-2">
              <GoalTile category={lead} big />
            </li>
          )}
          {rest.map((c) => (
            <li key={c._id}>
              <GoalTile category={c} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function GoalTile({ category, big = false }) {
  const goal = GOALS[category.slug] ?? category.name;
  if (big) {
    return (
      <Link
        to={`/category/${category.slug}`}
        className="group relative flex h-full min-h-[340px] flex-col justify-end overflow-hidden rounded-card bg-night-deep p-5 text-white md:p-7 lg:min-h-0"
        style={{
          backgroundImage:
            "radial-gradient(70% 55% at 60% 30%, rgb(243 107 39 / 0.35), rgb(243 107 39 / 0) 70%)",
        }}
      >
        <img
          src={cutoutSrc(LEAD_PACK.id, 400)}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute top-5 right-5 h-[38%] w-auto drop-shadow-[0_18px_24px_rgb(0_0_0/0.6)] transition-transform duration-(--duration-sheet) ease-(--ease-out-soft) group-hover:-translate-y-1 lg:right-1/2 lg:h-[36%] lg:translate-x-1/2 lg:group-hover:translate-x-1/2"
        />
        <span className="relative label-caps text-brand">{category.name}</span>
        <span className="relative mt-1.5 text-[2.75rem] font-display md:text-[3.5rem]">{goal}</span>
        {category.description && (
          <span className="relative mt-3 hidden max-w-[34ch] text-small text-night-muted md:line-clamp-3">
            {category.description}
          </span>
        )}
        <span className="relative mt-5 inline-flex h-11 items-center gap-2 self-start rounded-md bg-brand px-5 text-small font-bold text-ink transition-colors group-hover:bg-brand-hover">
          Shop {category.name.toLowerCase()} <ArrowRight aria-hidden="true" className="size-4" />
        </span>
      </Link>
    );
  }
  return (
    <Link
      to={`/category/${category.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-card border border-line bg-shelf transition-colors duration-(--duration-fast) hover:border-ink"
    >
      {category.imageUrl && (
        <CloudImage
          src={category.imageUrl}
          alt=""
          ratio={null}
          blend
          trim
          sizes="(min-width: 1024px) 18vw, 45vw"
          className="h-28 w-full flex-none md:h-36"
          imgClassName="p-3 transition-transform duration-(--duration-sheet) ease-(--ease-out-soft) group-hover:scale-[1.06]"
        />
      )}
      <span className="mt-auto flex items-end justify-between gap-2 px-4 pt-2 pb-4 md:px-5 md:pb-5">
        <span>
          <span className="block label-caps text-brand-ink">{category.name}</span>
          <span className="mt-1 block text-[1.6rem] font-display md:text-[2rem]">{goal}</span>
        </span>
        <ArrowRight
          aria-hidden="true"
          className="mb-1.5 size-5 flex-none transition-transform duration-(--duration-fast) group-hover:translate-x-0.5"
        />
      </span>
    </Link>
  );
}

const TABS = [
  {
    id: "best",
    label: "Best sellers",
    eyebrow: "Most ordered",
    query: { sort: "bestselling" },
    to: "/shop?sort=bestselling",
  },
  {
    id: "new",
    label: "New arrivals",
    eyebrow: "Just in",
    query: { sort: "newest" },
    to: "/shop?sort=newest",
  },
  {
    id: "featured",
    label: "Featured",
    eyebrow: "Hand-picked",
    query: { featured: true },
    to: "/shop?featured=1",
  },
];

/**
 * One product section with tabs instead of three look-alike rails. Only the open tab is
 * fetched (cached afterwards), so switching back is instant and the first load stays one request.
 */
export function ProductTabs() {
  const [active, setActive] = useState(TABS[0].id);
  const uid = useId();
  const tab = TABS.find((t) => t.id === active) ?? TABS[0];
  const products = useProducts({ limit: 10, ...tab.query });
  const cards = useMemo(
    () => (products.data?.items ?? []).map((p) => toProductCard(p)),
    [products.data],
  );

  const onKeyDown = (e) => {
    const i = TABS.findIndex((t) => t.id === active);
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = TABS[(i + step + TABS.length) % TABS.length];
    setActive(next.id);
    document.getElementById(`${uid}-tab-${next.id}`)?.focus();
  };

  return (
    <section aria-labelledby={`${uid}-title`} className="page-container">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="label-caps text-brand-ink">{tab.eyebrow}</p>
          <h2
            id={`${uid}-title`}
            className="mt-2 text-[2.5rem] font-display md:text-[3.25rem] lg:text-[4rem]"
          >
            {tab.label}
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <div
            role="tablist"
            aria-label="Product lists"
            className="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 md:mx-0 md:px-0"
          >
            {TABS.map((t) => (
              <button
                key={t.id}
                id={`${uid}-tab-${t.id}`}
                type="button"
                role="tab"
                aria-selected={t.id === active}
                aria-controls={`${uid}-panel`}
                tabIndex={t.id === active ? 0 : -1}
                onClick={() => setActive(t.id)}
                onKeyDown={onKeyDown}
                className={cn(
                  "h-10 flex-none rounded-full border px-4 text-small font-bold transition-colors duration-(--duration-fast)",
                  t.id === active
                    ? "border-ink bg-ink text-white"
                    : "border-line-strong bg-surface text-ink hover:border-ink",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <Link
            to={tab.to}
            className="hidden flex-none items-center gap-1.5 font-bold hover:text-brand-ink lg:inline-flex"
          >
            View all <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </div>
      <div
        id={`${uid}-panel`}
        role="tabpanel"
        aria-labelledby={`${uid}-tab-${active}`}
        aria-busy={products.isPending || undefined}
        className="mt-7"
      >
        {products.isError || (!products.isPending && cards.length === 0) ? (
          <p className="py-10 text-ink-3">
            Nothing here right now —{" "}
            <Link to="/shop" className="font-bold text-ink underline underline-offset-4">
              browse all products
            </Link>
            .
          </p>
        ) : (
          <RailList cards={cards} loading={products.isPending} />
        )}
        <Link
          to={tab.to}
          className="mt-4 inline-flex items-center gap-1.5 font-bold hover:text-brand-ink lg:hidden"
        >
          View all {tab.label.toLowerCase()} <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </section>
  );
}
