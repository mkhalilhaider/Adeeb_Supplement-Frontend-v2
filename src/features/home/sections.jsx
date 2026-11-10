import { useMemo } from "react";
import { Link } from "react-router";
import { CloudImage } from "../../components/ui/CloudImage";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { Skeleton } from "../../components/ui/Skeleton";
import { ProductRail } from "../catalog/components/ProductRail";
import { toProductCard } from "../catalog/lib/product-view";
import { useProducts } from "../catalog/queries";
import { useTaxonomy } from "../catalog/useTaxonomy";

/** Quick category links right under the hero (scrollable row on phones). */
export function CategoryChips() {
  const { categories } = useTaxonomy();
  if (!categories.length) return <div className="h-[38px]" aria-hidden="true" />;
  return (
    <nav aria-label="Shop by category" className="page-container">
      <ul className="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
        {categories.map((c) => (
          <li key={c._id}>
            <Link
              to={`/category/${c.slug}`}
              className="inline-flex h-[38px] items-center rounded-sm border border-line-strong bg-surface px-3.5 text-small whitespace-nowrap transition-colors duration-(--duration-fast) hover:border-ink"
            >
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** A product rail fed by one listing query (sort / featured). */
export function QueryRail({ query, title, eyebrow, action, id }) {
  const products = useProducts({ limit: 10, ...query });
  const cards = useMemo(
    () => (products.data?.items ?? []).map((p) => toProductCard(p)),
    [products.data],
  );
  if (products.isError || (!products.isPending && cards.length === 0)) return null;
  return (
    <ProductRail
      id={id}
      eyebrow={eyebrow}
      title={title}
      cards={cards}
      loading={products.isPending}
      action={action}
    />
  );
}

/** Category tiles with their photos (taxonomy is cached, so usually no request). */
export function CategoryTiles() {
  const { categories, isPending } = useTaxonomy();
  return (
    <section aria-labelledby="categories-heading">
      <SectionHeading id="categories-heading" eyebrow="Shop by goal" title="Categories" />
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {isPending && !categories.length
          ? Array.from({ length: 7 }, (_, i) => (
              <li key={i}>
                <Skeleton className="aspect-square w-full" />
              </li>
            ))
          : categories.map((c) => (
              <li key={c._id}>
                <Link
                  to={`/category/${c.slug}`}
                  className="group flex flex-col gap-2 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <span className="block overflow-hidden bg-shelf">
                    <CloudImage
                      src={c.imageUrl}
                      alt=""
                      ratio="square"
                      sizes="(min-width: 1280px) 14vw, (min-width: 640px) 30vw, 46vw"
                      className="transition-transform duration-(--duration-sheet) group-hover:scale-[1.03]"
                    />
                  </span>
                  <span className="font-semibold group-hover:underline">{c.name}</span>
                </Link>
              </li>
            ))}
      </ul>
    </section>
  );
}
