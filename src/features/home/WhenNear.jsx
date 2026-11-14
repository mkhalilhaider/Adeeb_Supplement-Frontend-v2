import { Suspense, useEffect, useRef, useState } from "react";
import { useInViewOnce } from "../../lib/hooks";

/**
 * Mount a section only when it is about to scroll into view (about a screen early), so its
 * code and data cost nothing for visitors who never get that far. Reserves height meanwhile
 * so the page doesn't jump. Once mounted, the section fades up when it actually enters the
 * screen (CSS in index.css; skipped entirely under reduced motion).
 *
 * @param {{ children: import("react").ReactNode, minHeight?: number|string, className?: string }} props
 */
export function WhenNear({ children, minHeight = 320, className }) {
  const [ref, seen] = useInViewOnce({ rootMargin: "800px 0px" });
  const boxRef = useRef(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = boxRef.current;
    if (!seen || revealed || !el) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          io.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen, revealed]);

  return (
    <div ref={ref} className={className} style={seen ? undefined : { minHeight }}>
      {seen && (
        <div ref={boxRef} data-reveal={revealed ? "in" : "out"}>
          <Suspense fallback={<div style={{ minHeight }} />}>{children}</Suspense>
        </div>
      )}
    </div>
  );
}
