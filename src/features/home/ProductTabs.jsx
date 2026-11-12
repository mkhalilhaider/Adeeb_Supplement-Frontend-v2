import { useId, useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { cn } from "../../lib/cn";
import { RailList } from "../catalog/components/ProductRail";
import { toProductCard } from "../catalog/lib/product-view";
import { useProducts } from "../catalog/queries";

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
export default function ProductTabs() {
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
