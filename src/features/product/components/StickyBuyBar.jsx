import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/Button";
import { Price } from "../../../components/ui/Price";
import { cn } from "../../../lib/cn";
import { isPurchasable } from "../../catalog/lib/product-view";

/**
 * Phone-only bar pinned to the bottom once the main "Add to cart" scrolls out of view, so the
 * purchase is always one tap away. Hidden while the main button is visible.
 *
 * @param {{ targetRef: import("react").RefObject<HTMLElement>, variant: any, onAdd: () => void, adding: boolean, name: string }} props
 */
export function StickyBuyBar({ targetRef, variant, onAdd, adding, name }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return undefined;
    // Show only once the button is *above* the viewport. The root is extended far downward, so
    // the button counts as "intersecting" while on screen or below it, and the only change is
    // crossing the top edge — which a fast flick past the button can't skip.
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), {
      rootMargin: "0px 0px 100000px 0px",
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [targetRef, variant?._id]);

  // Lets the floating WhatsApp button step up above this bar while it shows.
  useEffect(() => {
    document.documentElement.toggleAttribute("data-buybar", visible);
    return () => document.documentElement.removeAttribute("data-buybar");
  }, [visible]);

  if (!variant) return null;
  const sellable = isPurchasable(variant);

  return (
    <div
      aria-hidden={!visible}
      inert={!visible}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-sheet md:hidden",
        "transition-transform duration-(--duration-sheet) ease-(--ease-out-soft)",
        visible ? "translate-y-0" : "translate-y-full",
      )}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-small text-ink-2">{name}</p>
          <Price price={variant.price} salePrice={variant.salePrice} size="sm" />
        </div>
        <Button onClick={onAdd} loading={adding} disabled={!sellable} className="shrink-0">
          {sellable ? "Add to cart" : "Sold out"}
        </Button>
      </div>
    </div>
  );
}
