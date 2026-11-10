import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/cn";

/**
 * Horizontal slider on native scroll-snap: swipe on phones, arrow buttons on desktop, keyboard
 * scrolling when focused. No carousel library and no autoplay.
 *
 * `onNearEnd` fires when one of the last `nearEndCount` slides comes into view (load the next
 * page there).
 *
 * @param {{ label: string, header?: import("react").ReactNode, items: any[], renderItem: (item: any, index: number) => import("react").ReactNode,
 *   getKey: (item: any) => string, itemClassName: string, onNearEnd?: () => void, nearEndCount?: number }} props
 */
export function Slider({
  label,
  header,
  items,
  renderItem,
  getKey,
  itemClassName,
  onNearEnd,
  nearEndCount = 2,
}) {
  const trackRef = useRef(/** @type {HTMLUListElement|null} */ (null));
  const [edges, setEdges] = useState({ start: true, end: false });

  // Arrow state follows the scroll position.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    const update = () =>
      setEdges({
        start: track.scrollLeft <= 4,
        end: track.scrollLeft + track.clientWidth >= track.scrollWidth - 4,
      });
    update();
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      track.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [items.length]);

  // Next page when the last slides come into view.
  useEffect(() => {
    const track = trackRef.current;
    if (!track || !onNearEnd || items.length === 0) return undefined;
    const tail = [...track.children].slice(-nearEndCount);
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) onNearEnd();
      },
      { root: track, rootMargin: "0px 200px 0px 0px" },
    );
    tail.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items.length, onNearEnd, nearEndCount]);

  const scrollBy = (direction) => {
    const track = trackRef.current;
    if (!track) return;
    const slide = track.firstElementChild;
    const step = slide ? slide.getBoundingClientRect().width + 12 : track.clientWidth * 0.8;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollBy({ left: direction * step, behavior: reduce ? "auto" : "smooth" });
  };

  const arrow =
    "hidden size-10 items-center justify-center rounded-full border border-line-strong bg-surface text-ink transition-colors duration-(--duration-fast) hover:border-ink disabled:opacity-30 disabled:hover:border-line-strong md:flex";

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="min-w-0 flex-1">{header}</div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            className={arrow}
            onClick={() => scrollBy(-1)}
            disabled={edges.start}
            aria-label={`Previous — ${label}`}
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
          </button>
          <button
            type="button"
            className={arrow}
            onClick={() => scrollBy(1)}
            disabled={edges.end}
            aria-label={`Next — ${label}`}
          >
            <ChevronRight aria-hidden="true" className="size-5" />
          </button>
        </div>
      </div>
      <ul
        ref={trackRef}
        aria-label={label}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrollable region must be keyboard reachable (WCAG 2.1.1)
        tabIndex={0}
        className={cn(
          "-mx-4 flex snap-x snap-mandatory scroll-px-4 [scrollbar-width:none] gap-3 overflow-x-auto px-4 pb-2",
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
  );
}
