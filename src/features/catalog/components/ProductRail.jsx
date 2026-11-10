import { SectionHeading } from "../../../components/ui/SectionHeading";
import { cn } from "../../../lib/cn";
import { ProductCard, ProductCardSkeleton } from "./ProductCard";

/**
 * Horizontal row of products: swipe on phones (scroll-snap, ~2.3 cards visible so it's obvious
 * there's more), a 4–5 column row on desktop. Used for related, recently viewed and home rails.
 *
 * @param {{ title: string, eyebrow?: string, index?: number, cards?: any[], loading?: boolean, action?: {label: string, to: string}, id?: string }} props
 */
export function ProductRail({
  title,
  eyebrow,
  index,
  cards = [],
  loading = false,
  action,
  id,
  className,
}) {
  if (!loading && cards.length === 0) return null;
  const items = loading ? Array.from({ length: 5 }, () => null) : cards;

  return (
    <section aria-labelledby={id} aria-busy={loading || undefined} className={className}>
      <SectionHeading id={id} eyebrow={eyebrow} index={index} title={title} action={action} />
      <ul
        className={cn(
          "-mx-4 mt-6 flex snap-x snap-mandatory scroll-px-4 [scrollbar-width:none] gap-3 overflow-x-auto px-4 pb-2",
          "md:mx-0 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:px-0 xl:grid-cols-5",
        )}
      >
        {items.map((card, i) => (
          <li key={card?.id ?? i} className="w-[43%] shrink-0 snap-start sm:w-[30%] md:w-auto">
            {card ? <ProductCard card={card} /> : <ProductCardSkeleton />}
          </li>
        ))}
      </ul>
    </section>
  );
}
