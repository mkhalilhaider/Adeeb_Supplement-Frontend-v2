import { Suspense } from "react";
import { useInViewOnce } from "../../lib/hooks";

/**
 * Mount a section only when it is about to scroll into view (about a screen early), so its
 * code and data cost nothing for visitors who never get that far. Reserves height meanwhile
 * so the page doesn't jump.
 *
 * @param {{ children: import("react").ReactNode, minHeight?: number|string, className?: string }} props
 */
export function WhenNear({ children, minHeight = 320, className }) {
  const [ref, seen] = useInViewOnce({ rootMargin: "800px 0px" });
  return (
    <div ref={ref} className={className} style={seen ? undefined : { minHeight }}>
      {seen && <Suspense fallback={<div style={{ minHeight }} />}>{children}</Suspense>}
    </div>
  );
}
