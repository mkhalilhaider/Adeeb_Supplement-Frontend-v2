import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "../../lib/cn";

const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Horizontal slider on native scroll-snap: swipe on phones; on desktop, plain arrows either
 * side of the row and page dots under it. The arrows loop: "next" on the last page goes back
 * to the first and "previous" on the first goes to the last. Keyboard scrolling works when the
 * row is focused. No carousel library and no autoplay.
 *
 * @param {{ label: string, header?: import("react").ReactNode, headerAside?: import("react").ReactNode,
 *   items: any[], renderItem: (item: any, index: number) => import("react").ReactNode,
 *   getKey: (item: any) => string, itemClassName: string, showDots?: boolean }} props
 */
export function Slider({
  label,
  header,
  headerAside,
  items,
  renderItem,
  getKey,
  itemClassName,
  showDots = false,
}) {
  const trackRef = useRef(/** @type {HTMLUListElement|null} */ (null));
  const [pages, setPages] = useState({ count: 1, current: 0, start: true, end: false });

  // Page count, current page and whether we're at either end follow the scroll position.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    const update = () => {
      const start = track.scrollLeft <= 4;
      const end = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      const count = Math.max(1, Math.ceil((track.scrollWidth - 4) / track.clientWidth));
      setPages({
        count,
        current: end ? count - 1 : Math.round(track.scrollLeft / track.clientWidth),
        start,
        end,
      });
    };
    update();
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      track.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [items.length]);

  const behavior = () => (reduceMotion() ? "auto" : "smooth");

  const step = (direction) => {
    const track = trackRef.current;
    if (!track) return;
    // Loop round at either end.
    if (direction > 0 && pages.end) return track.scrollTo({ left: 0, behavior: behavior() });
    if (direction < 0 && pages.start) {
      return track.scrollTo({ left: track.scrollWidth, behavior: behavior() });
    }
    const slide = track.firstElementChild;
    const width = slide ? slide.getBoundingClientRect().width + 12 : track.clientWidth * 0.8;
    track.scrollBy({ left: direction * width, behavior: behavior() });
  };

  const toPage = (page) => {
    const track = trackRef.current;
    track?.scrollTo({ left: page * track.clientWidth, behavior: behavior() });
  };

  const scrollable = pages.count > 1;
  const arrow =
    "group/arrow absolute top-1/2 z-10 hidden size-11 -translate-y-1/2 items-center justify-center text-ink transition-[color,scale] duration-(--duration-fast) hover:text-brand-ink active:scale-90 md:flex";
  const icon = "size-7 transition-transform duration-(--duration-base) ease-(--ease-out-soft)";

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        {/* Phones: the heading gets the full row and anything beside it drops underneath. */}
        <div className="w-full min-w-0 sm:w-auto sm:flex-1">{header}</div>
        {headerAside}
      </div>
      <div className="relative md:px-12">
        {scrollable && (
          <>
            <button
              type="button"
              className={cn(arrow, "-left-1")}
              onClick={() => step(-1)}
              aria-label={`Previous — ${label}`}
            >
              <ArrowLeft
                aria-hidden="true"
                strokeWidth={1.75}
                className={cn(icon, "group-hover/arrow:-translate-x-1")}
              />
            </button>
            <button
              type="button"
              className={cn(arrow, "-right-1")}
              onClick={() => step(1)}
              aria-label={`Next — ${label}`}
            >
              <ArrowRight
                aria-hidden="true"
                strokeWidth={1.75}
                className={cn(icon, "group-hover/arrow:translate-x-1")}
              />
            </button>
          </>
        )}
        <ul
          ref={trackRef}
          aria-label={label}
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrollable region must be keyboard reachable (WCAG 2.1.1)
          tabIndex={0}
          className={cn(
            // Room above and below so lifted cards and their shadows aren't clipped by the scroller.
            "-mx-4 -my-4 flex snap-x snap-mandatory scroll-px-4 [scrollbar-width:none] gap-3 overflow-x-auto px-4 py-4",
            "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink md:mx-0 md:scroll-px-0 md:px-0",
          )}
        >
          {items.map((item, i) => (
            <li key={getKey(item)} className={cn("shrink-0 snap-start", itemClassName)}>
              {renderItem(item, i)}
            </li>
          ))}
        </ul>
      </div>
      {showDots && scrollable && (
        <div className="mt-3 flex justify-center">
          {Array.from({ length: pages.count }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to page ${i + 1} of ${pages.count} — ${label}`}
              aria-current={i === pages.current}
              onClick={() => toPage(i)}
              // Padding makes each dot an easier tap target without making it bigger.
              className="flex h-8 items-center px-1.5"
            >
              <span
                className={cn(
                  "block h-1.5 rounded-full transition-[width,background-color] duration-300",
                  i === pages.current ? "w-7 bg-brand" : "w-1.5 bg-line-strong hover:bg-ink-3",
                )}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
